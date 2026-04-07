const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const { getAddress, verifyMessage } = require('ethers');
const User = require('../models/User');
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');
const { recordAudit } = require('../services/audit');

const router = express.Router();
const magicLoginChallenges = new Map();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || undefined);

function signAccessToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

function signRefreshToken(id) {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiryMs() {
  return Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS || 30 * 24 * 60 * 60 * 1000);
}

function setRefreshCookie(res, refreshToken) {
  res.cookie('dhts_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: getRefreshExpiryMs(),
    path: '/api/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('dhts_refresh', { path: '/api/auth' });
}

function getClientMetadata(req) {
  const userAgent = req.get('user-agent') || '';
  const explicitDevice = typeof req.body?.deviceName === 'string' ? req.body.deviceName.trim() : '';
  const deviceName = explicitDevice || userAgent.split(' ').slice(0, 3).join(' ') || 'Unknown Device';
  return {
    userAgent,
    deviceName,
    ipAddress: req.ip,
  };
}

async function sendTokenResponse(user, statusCode, res, req, action, metadata = {}) {
  const token = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  const refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  user.lastLoginAt = new Date();
  await user.save();

  const client = getClientMetadata(req);
  await Session.create({
    user: user._id,
    refreshTokenHash,
    expiresAt: user.refreshTokenExpiresAt,
    deviceName: client.deviceName,
    userAgent: client.userAgent,
    ipAddress: client.ipAddress,
    lastSeenAt: new Date(),
  });

  setRefreshCookie(res, refreshToken);

  await recordAudit({
    user: user._id,
    action,
    entityType: 'user',
    entityId: String(user._id),
    metadata,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  });

  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      phone: user.phone,
      healthId: user.healthId,
      walletAddress: user.walletAddress || null,
      authProviders: user.authProviders || ['email'],
      emailVerified: !!user.emailVerified,
    },
  });
}

async function upsertDirectLoginUser({ email, displayName, phone, role, provider, providerId, emailVerified }) {
  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({
    $or: [{ email: normalizedEmail }, ...(providerId ? [{ providerId }] : [])],
  });

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      password: crypto.randomBytes(24).toString('hex'),
      role: role || 'patient',
      displayName,
      phone,
      providerId,
      emailVerified: !!emailVerified,
      authProviders: [provider || 'email'],
    });
  } else {
    if (displayName && !user.displayName) user.displayName = displayName;
    if (phone && !user.phone) user.phone = phone;
    if (providerId && !user.providerId) user.providerId = providerId;
    user.emailVerified = user.emailVerified || !!emailVerified;
    if (provider && !user.authProviders.includes(provider)) {
      user.authProviders.push(provider);
    }
    await user.save();
  }

  return user;
}

function normalizeWalletAddress(address) {
  try {
    return getAddress(address).toLowerCase();
  } catch {
    return null;
  }
}

function createWalletNonce() {
  return `Healthcare Blockchain login\nNonce: ${crypto.randomBytes(16).toString('hex')}`;
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['patient', 'doctor', 'pharmacy', 'hospital', 'admin'])
      .withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, displayName, phone } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = await User.create({ email, password, role, displayName, phone, emailVerified: true });
      await sendTokenResponse(user, 201, res, req, 'AUTH_REGISTER', { email: user.email, role: user.role });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+password +refreshTokenHash +refreshTokenExpiresAt');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      await sendTokenResponse(user, 200, res, req, 'AUTH_LOGIN_PASSWORD', { email: user.email, role: user.role });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/magic/request
router.post(
  '/magic/request',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const email = req.body.email.toLowerCase().trim();
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    magicLoginChallenges.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      role: req.body.role,
      displayName: req.body.displayName,
      phone: req.body.phone,
      provider: req.body.provider || 'email',
    });

    return res.json({
      message: 'Magic login code generated',
      email,
      code: process.env.NODE_ENV === 'production' ? undefined : code,
      expiresInMinutes: 10,
    });
  }
);

// POST /api/auth/magic/verify
router.post(
  '/magic/verify',
  [body('email').isEmail().normalizeEmail(), body('code').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const email = req.body.email.toLowerCase().trim();
    const challenge = magicLoginChallenges.get(email);

    if (!challenge) {
      return res.status(400).json({ message: 'No pending magic login request' });
    }
    if (challenge.expiresAt < Date.now()) {
      magicLoginChallenges.delete(email);
      return res.status(400).json({ message: 'Magic login code expired' });
    }
    if (challenge.code !== req.body.code.trim().toUpperCase()) {
      return res.status(401).json({ message: 'Invalid magic login code' });
    }

    try {
      const user = await upsertDirectLoginUser({
        email,
        displayName: challenge.displayName,
        phone: challenge.phone,
        role: challenge.role,
        provider: challenge.provider,
        emailVerified: true,
      });

      magicLoginChallenges.delete(email);
      return sendTokenResponse(user, 200, res, req, 'AUTH_LOGIN_MAGIC', {
        email: user.email,
        provider: challenge.provider,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/google - verify Google ID token and login/register user
router.post(
  '/google',
  [body('idToken').notEmpty().withMessage('idToken is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: 'Google OAuth is not configured' });
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: req.body.idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload?.email) {
        return res.status(400).json({ message: 'Google token is missing email' });
      }

      const user = await upsertDirectLoginUser({
        email: payload.email,
        displayName: payload.name,
        role: req.body.role,
        provider: 'google',
        providerId: payload.sub,
        emailVerified: !!payload.email_verified,
      });

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      return sendTokenResponse(user, 200, res, req, 'AUTH_LOGIN_GOOGLE', {
        email: user.email,
        provider: 'google',
      });
    } catch (err) {
      return res.status(401).json({ message: `Google token verification failed: ${err.message}` });
    }
  }
);

// POST /api/auth/identity/login – direct provider login for non-OAuth integrations
router.post(
  '/identity/login',
  [body('email').isEmail().normalizeEmail(), body('provider').isString().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await upsertDirectLoginUser({
        email: req.body.email,
        displayName: req.body.displayName,
        phone: req.body.phone,
        role: req.body.role,
        provider: req.body.provider,
        providerId: req.body.providerId,
        emailVerified: req.body.emailVerified !== false,
      });

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      return sendTokenResponse(user, 200, res, req, 'AUTH_LOGIN_IDENTITY', {
        email: user.email,
        provider: req.body.provider,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/wallet/nonce
router.post(
  '/wallet/nonce',
  [body('walletAddress').notEmpty().withMessage('walletAddress is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const normalizedAddress = normalizeWalletAddress(req.body.walletAddress);
    if (!normalizedAddress) {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }

    const nonce = createWalletNonce();

    try {
      let user = await User.findOne({ walletAddress: normalizedAddress });

      if (user) {
        if (!user.isActive) {
          return res.status(403).json({ message: 'Account is deactivated' });
        }
        user.walletNonce = nonce;
      } else {
        const generatedEmail = `wallet-${normalizedAddress.slice(2)}@wallet.local`;
        const generatedPassword = crypto.randomBytes(24).toString('hex');
        user = await User.create({
          email: generatedEmail,
          password: generatedPassword,
          role: 'patient',
          displayName: `Wallet ${normalizedAddress.slice(2, 8)}`,
          walletAddress: normalizedAddress,
          walletNonce: nonce,
        });
      }

      await user.save();

      return res.json({
        message: nonce,
        walletAddress: normalizedAddress,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/wallet/verify
router.post(
  '/wallet/verify',
  [
    body('walletAddress').notEmpty().withMessage('walletAddress is required'),
    body('signature').notEmpty().withMessage('signature is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const normalizedAddress = normalizeWalletAddress(req.body.walletAddress);
    if (!normalizedAddress) {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }

    const { signature } = req.body;

    try {
      const user = await User.findOne({ walletAddress: normalizedAddress }).select('+walletNonce +refreshTokenHash +refreshTokenExpiresAt');
      if (!user) {
        return res.status(404).json({ message: 'Wallet account not found' });
      }

      if (!user.walletNonce) {
        return res.status(400).json({ message: 'No pending wallet challenge. Request nonce again.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      let recoveredAddress;
      try {
        recoveredAddress = verifyMessage(user.walletNonce, signature).toLowerCase();
      } catch {
        return res.status(401).json({ message: 'Invalid signature' });
      }

      if (recoveredAddress !== normalizedAddress) {
        return res.status(401).json({ message: 'Signature verification failed' });
      }

      user.walletNonce = undefined;
      user.walletLastLoginAt = new Date();
      return sendTokenResponse(user, 200, res, req, 'AUTH_LOGIN_WALLET', {
        walletAddress: normalizedAddress,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/refresh – rotate access token using refresh token
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.dhts_refresh || req.body?.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token type' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash +refreshTokenExpiresAt');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const refreshTokenHash = hashToken(refreshToken);
    if (!user.refreshTokenHash || user.refreshTokenHash !== refreshTokenHash) {
      return res.status(401).json({ message: 'Refresh token mismatch' });
    }

    const activeSession = await Session.findOne({
      user: user._id,
      refreshTokenHash,
      isRevoked: false,
      expiresAt: { $gte: new Date() },
    });
    if (!activeSession) {
      return res.status(401).json({ message: 'Session expired or revoked' });
    }

    activeSession.isRevoked = true;
    activeSession.lastSeenAt = new Date();
    await activeSession.save();

    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt.getTime() < Date.now()) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    return sendTokenResponse(user, 200, res, req, 'AUTH_TOKEN_REFRESH', { email: user.email });
  } catch (err) {
    return res.status(401).json({ message: `Refresh failed: ${err.message}` });
  }
});

// POST /api/auth/logout – revoke refresh token
router.post('/logout', protect, async (req, res) => {
  try {
    const refreshToken = req.cookies?.dhts_refresh || req.body?.refreshToken;
    const user = await User.findById(req.user._id).select('+refreshTokenHash +refreshTokenExpiresAt');
    if (user) {
      user.refreshTokenHash = undefined;
      user.refreshTokenExpiresAt = undefined;
      await user.save();
    }

    if (refreshToken) {
      await Session.updateMany(
        { user: req.user._id, refreshTokenHash: hashToken(refreshToken), isRevoked: false },
        { $set: { isRevoked: true, lastSeenAt: new Date() } }
      );
    }

    clearRefreshCookie(res);

    await recordAudit({
      user: req.user._id,
      action: 'AUTH_LOGOUT',
      entityType: 'user',
      entityId: String(req.user._id),
      metadata: { email: req.user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/logout-all', protect, async (req, res) => {
  try {
    await Session.updateMany(
      { user: req.user._id, isRevoked: false },
      { $set: { isRevoked: true, lastSeenAt: new Date() } }
    );

    const user = await User.findById(req.user._id).select('+refreshTokenHash +refreshTokenExpiresAt');
    if (user) {
      user.refreshTokenHash = undefined;
      user.refreshTokenExpiresAt = undefined;
      await user.save();
    }

    clearRefreshCookie(res);
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id, isRevoked: false, expiresAt: { $gte: new Date() } })
      .sort({ lastSeenAt: -1 })
      .select('deviceName ipAddress userAgent lastSeenAt createdAt expiresAt');

    const currentSession = sessions.find((session) => {
      const sameIp = session.ipAddress && session.ipAddress === req.ip;
      const sameAgent = session.userAgent && session.userAgent === (req.get('user-agent') || '');
      return sameIp || sameAgent;
    });

    const normalizedSessions = sessions.map((session) => ({
      ...session.toObject(),
      isCurrentDevice: currentSession ? String(currentSession._id) === String(session._id) : false,
    }));

    res.json({ sessions: normalizedSessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/sessions/:sessionId/revoke', protect, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      user: req.user._id,
      isRevoked: false,
      expiresAt: { $gte: new Date() },
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found or already revoked' });
    }

    session.isRevoked = true;
    session.lastSeenAt = new Date();
    await session.save();

    await recordAudit({
      user: req.user._id,
      action: 'AUTH_SESSION_REVOKED',
      entityType: 'session',
      entityId: String(session._id),
      metadata: { ipAddress: session.ipAddress, deviceName: session.deviceName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.json({ success: true, sessionId: String(session._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me – return current user
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile – update displayName and phone
router.put(
  '/profile',
  protect,
  [
    body('displayName').optional().trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { displayName, phone } = req.body;
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (phone !== undefined) updates.phone = phone;

    try {
      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        returnDocument: 'after',
        runValidators: true,
      });
      await recordAudit({
        user: req.user._id,
        action: 'PROFILE_UPDATE',
        entityType: 'user',
        entityId: String(req.user._id),
        metadata: updates,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/auth-methods', protect, async (req, res) => {
  res.json({
    methods: req.user.authProviders || ['email'],
    emailVerified: !!req.user.emailVerified,
    walletAddress: req.user.walletAddress || null,
  });
});

router.put(
  '/notification-preferences',
  protect,
  async (req, res) => {
    try {
      const allowedKeys = [
        'email',
        'sms',
        'inApp',
        'bloodDonationAlerts',
        'organDonationAlerts',
        'emergencyAlerts',
        'certificateAlerts',
      ];

      const nextPreferences = { ...(req.user.notificationPreferences || {}) };
      for (const key of allowedKeys) {
        if (typeof req.body?.[key] === 'boolean') {
          nextPreferences[key] = req.body[key];
        }
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { notificationPreferences: nextPreferences },
        { returnDocument: 'after', runValidators: true }
      );
      res.json({ notificationPreferences: user.notificationPreferences });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
