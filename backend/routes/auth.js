const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { getAddress, verifyMessage } = require('ethers');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

function sendTokenResponse(user, statusCode, res) {
  const token = signToken(user._id);
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
    },
  });
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

      const user = await User.create({ email, password, role, displayName, phone });
      sendTokenResponse(user, 201, res);
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
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      sendTokenResponse(user, 200, res);
    } catch (err) {
      res.status(500).json({ message: err.message });
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
      const user = await User.findOne({ walletAddress: normalizedAddress }).select('+walletNonce');
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
      await user.save();

      return sendTokenResponse(user, 200, res);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

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
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
