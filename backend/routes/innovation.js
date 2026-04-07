const express = require('express');
const crypto = require('crypto');
const { body, validationResult, query } = require('express-validator');
const { protect, restrictTo } = require('../middleware/auth');
const { evaluateRecordReadAccess } = require('../middleware/recordAccess');
const ShareLink = require('../models/ShareLink');
const AuditLog = require('../models/AuditLog');
const Prescription = require('../models/Prescription');
const EmergencyAlert = require('../models/EmergencyAlert');
const SecureMedicalRecord = require('../models/SecureMedicalRecord');
const ConsentGrant = require('../models/ConsentGrant');
const Appointment = require('../models/Appointment');
const OfflineAction = require('../models/OfflineAction');
const SavedFilterView = require('../models/SavedFilterView');
const User = require('../models/User');
const { recordAudit } = require('../services/audit');
const notificationService = require('../services/notifications');
const { publishLiveAlert } = require('../services/liveAlertsHub');

const router = express.Router();

async function normalizePatientOwner(patientAddress) {
  return User.findOne({ walletAddress: String(patientAddress || '').trim().toLowerCase() }).select('_id email walletAddress');
}

router.get('/share-links/public/:token', async (req, res) => {
  const link = await ShareLink.findOne({ token: req.params.token });
  if (!link) return res.status(404).json({ message: 'Share link not found' });

  const now = new Date();
  const exceededViews = link.views >= Number(link.maxViews || 1);
  if (link.revoked || now >= new Date(link.expiresAt) || exceededViews) {
    return res.status(410).json({ message: 'Share link expired or revoked' });
  }

  const records = await SecureMedicalRecord.find({ patient: link.patientAddress }).sort({ createdAt: -1 }).limit(20);

  link.views += 1;
  if (link.oneTime || link.views >= Number(link.maxViews || 1)) {
    link.revoked = true;
  }
  await link.save();

  res.json({
    records: records.map((item) => ({
      id: item._id,
      payloadHash: item.payloadHash,
      createdAt: item.createdAt,
      watermark: link.watermarkText,
      controls: {
        allowDownload: !!link.allowDownload,
      },
    })),
    share: {
      oneTime: !!link.oneTime,
      viewsUsed: link.views,
      maxViews: link.maxViews,
      expiresAt: link.expiresAt,
      watermarkText: link.watermarkText,
      allowDownload: !!link.allowDownload,
    },
  });
});

router.use(protect);

router.post('/access-rules/evaluate', [body('patientAddress').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const context = String(req.body.context || 'normal').toLowerCase();
  const result = await evaluateRecordReadAccess(req.user, req.body.patientAddress, { context });

  if (!result.allowed && context === 'emergency' && req.body.breakGlassReason) {
    if (!['doctor', 'hospital', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        allowed: false,
        reason: 'Break-glass is only allowed for doctor, hospital, or admin roles',
      });
    }

    await recordAudit({
      user: req.user._id,
      action: 'BREAK_GLASS_ACCESS_GRANTED',
      entityType: 'medicalRecord',
      entityId: String(req.body.patientAddress).toLowerCase(),
      metadata: {
        context,
        reason: req.body.breakGlassReason,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.json({
      allowed: true,
      breakGlass: true,
      reason: 'Emergency break-glass access granted with mandatory audit reason',
      consentId: null,
    });
  }

  res.json({
    allowed: !!result.allowed,
    reason: result.allowed ? 'Access granted by rules engine' : result.error,
    consentId: result.consentId ? String(result.consentId) : null,
  });
});

router.post(
  '/share-links',
  [body('patientAddress').notEmpty(), body('hours').optional().isInt({ min: 1, max: 168 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const hours = Number(req.body.hours || 24);
    const token = crypto.randomBytes(16).toString('hex');
    const link = await ShareLink.create({
      owner: req.user._id,
      ownerEmail: req.user.email,
      patientAddress: String(req.body.patientAddress).toLowerCase(),
      token,
      purpose: req.body.purpose || 'record-share',
      watermarkText: req.body.watermarkText || `Shared for ${req.body.purpose || 'record-share'}`,
      allowDownload: !!req.body.allowDownload,
      oneTime: req.body.oneTime !== false,
      maxViews: req.body.oneTime === false ? Number(req.body.maxViews || 3) : 1,
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    });

    res.status(201).json({
      link: {
        id: link._id,
        token: link.token,
        expiresAt: link.expiresAt,
        oneTime: link.oneTime,
        maxViews: link.maxViews,
        watermarkText: link.watermarkText,
        allowDownload: link.allowDownload,
      },
    });
  }
);

router.post('/share-links/:id/revoke', async (req, res) => {
  const link = await ShareLink.findOne({ _id: req.params.id, ownerEmail: req.user.email });
  if (!link) return res.status(404).json({ message: 'Share link not found' });
  link.revoked = true;
  await link.save();
  res.json({ success: true });
});

router.get('/alerts/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const pulse = setInterval(() => {
    const payload = {
      type: 'heartbeat',
      ts: Date.now(),
      message: 'Alerts stream is active',
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(pulse);
  });
});

router.post('/alerts/:id/ack', [body('state').isIn(['seen', 'accepted', 'resolved'])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const alert = await EmergencyAlert.findById(req.params.id);
  if (!alert) return res.status(404).json({ message: 'Alert not found' });

  const now = new Date();
  const state = req.body.state;
  if (state === 'seen') alert.seenAt = now;
  if (state === 'accepted') alert.acceptedAt = now;
  if (state === 'resolved') alert.resolvedAt = now;
  alert.status = state;
  alert.acknowledgedBy = req.user._id;
  alert.workflowLog.push({ state, by: req.user._id, at: now, note: req.body.note || '' });
  await alert.save();

  publishLiveAlert({
    type: 'alert-workflow',
    priority: alert.urgency === 'critical' ? 'CRITICAL' : 'HIGH',
    payload: {
      alertId: String(alert._id),
      state,
      actor: req.user.email,
      at: now,
    },
  });

  res.json({ success: true, alert });
});

router.post('/alerts/:id/escalate', async (req, res) => {
  const alert = await EmergencyAlert.findById(req.params.id);
  if (!alert) return res.status(404).json({ message: 'Alert not found' });

  const ladder = ['doctor', 'hospital', 'admin'];
  const nextRole = ladder[Math.min(alert.escalationLevel, ladder.length - 1)];

  const escalatedUsers = await User.find({ role: nextRole, isActive: true }).limit(20).select('email role');
  for (const user of escalatedUsers) {
    await notificationService.sendEmergencyAlert(user.email, {
      message: alert.message,
      urgency: alert.urgency,
      escalationRole: nextRole,
    });
  }

  alert.escalationLevel = Math.min(alert.escalationLevel + 1, ladder.length);
  alert.escalationHistory.push({
    toRole: nextRole,
    reason: req.body.reason || 'Manual escalation',
    at: new Date(),
  });
  await alert.save();

  publishLiveAlert({
    type: 'alert-escalation',
    priority: 'CRITICAL',
    payload: {
      alertId: String(alert._id),
      toRole: nextRole,
      users: escalatedUsers.length,
    },
  });

  res.json({ success: true, escalatedTo: nextRole, notifiedUsers: escalatedUsers.length, alert });
});

router.get('/timeline/:patientAddress', async (req, res) => {
  const access = await evaluateRecordReadAccess(req.user, req.params.patientAddress);
  if (!access.allowed) {
    return res.status(access.status || 403).json({ message: access.error || 'Access denied' });
  }

  const owner = await normalizePatientOwner(req.params.patientAddress);
  const patientEmail = owner?.email || null;

  const [records, emergencies, audit, prescriptions, appointments, consentChanges] = await Promise.all([
    SecureMedicalRecord.find({ patient: String(req.params.patientAddress).toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(20),
    EmergencyAlert.find().sort({ createdAt: -1 }).limit(10),
    AuditLog.find({ entityId: String(req.params.patientAddress).toLowerCase() }).sort({ createdAt: -1 }).limit(20),
    patientEmail
      ? Prescription.find({ patientEmail }).sort({ createdAt: -1 }).limit(20)
      : Promise.resolve([]),
    patientEmail
      ? Appointment.find({ patientEmail }).sort({ createdAt: -1 }).limit(20)
      : Promise.resolve([]),
    owner
      ? ConsentGrant.find({ owner: owner._id }).sort({ createdAt: -1 }).limit(20)
      : Promise.resolve([]),
  ]);

  const timeline = [
    ...records.map((item) => ({ type: 'secure-record', ts: item.createdAt, label: 'Secure record captured' })),
    ...prescriptions.map((item) => ({ type: 'prescription', ts: item.createdAt, label: `${item.medication} (${item.status})` })),
    ...appointments.map((item) => ({ type: 'appointment', ts: item.createdAt, label: `${item.doctor} (${item.status})` })),
    ...emergencies.map((item) => ({ type: 'emergency', ts: item.createdAt, label: item.message })),
    ...consentChanges.map((item) => ({ type: 'consent', ts: item.updatedAt || item.createdAt, label: `${item.granteeName} (${item.status})` })),
    ...audit.map((item) => ({ type: 'audit', ts: item.createdAt, label: item.action })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

  res.json({ timeline, consentId: access.consentId ? String(access.consentId) : null });
});

router.get('/compliance', restrictTo('admin'), async (_req, res) => {
  const [blocked, unauthorized, expiredAttempts, consented, secureReads, criticalResolved] = await Promise.all([
    AuditLog.countDocuments({ action: /ACCESS_DENIED|REJECTED/i }),
    AuditLog.countDocuments({ action: /ACCESS_DENIED|UNAUTHORIZED|BREAK_GLASS_DENIED/i }),
    AuditLog.countDocuments({ action: /ACCESS_DENIED/i, metadata: { $elemMatch: { reason: /expired/i } } }).catch(() => 0),
    AuditLog.countDocuments({ action: /CONSENT_/i }),
    AuditLog.countDocuments({ action: /MEDICAL_RECORDS_VIEWED|SECURE_MEDICAL_RECORDS_VIEWED/i }),
    EmergencyAlert.find({ urgency: 'critical', resolvedAt: { $ne: null } }).select('createdAt resolvedAt'),
  ]);

  const mttrMs = criticalResolved.length === 0
    ? 0
    : Math.round(
      criticalResolved.reduce((acc, item) => acc + (new Date(item.resolvedAt).getTime() - new Date(item.createdAt).getTime()), 0)
      / criticalResolved.length
    );

  res.json({
    blockedAttempts: blocked,
    consentViolationsBlocked: blocked,
    unauthorizedAccessAttempts: unauthorized,
    expiredConsentUsageAttempts: expiredAttempts,
    meanCriticalAlertResponseMs: mttrMs,
    consentEvents: consented,
    secureReadEvents: secureReads,
  });
});

router.get('/offline/status', async (req, res) => {
  const queueSize = await OfflineAction.countDocuments({ user: req.user._id, status: 'queued' });
  res.json({
    cacheReady: true,
    syncQueueSize: queueSize,
    syncState: queueSize > 0 ? 'pending-sync' : 'healthy',
    updatedAt: new Date().toISOString(),
  });
});

router.post('/offline/queue', [body('actionType').isString().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const action = await OfflineAction.create({
    user: req.user._id,
    actionType: req.body.actionType,
    payload: req.body.payload || {},
  });
  res.status(201).json({ action });
});

router.post('/offline/sync', async (req, res) => {
  const queued = await OfflineAction.find({ user: req.user._id, status: 'queued' }).sort({ createdAt: 1 }).limit(100);
  const now = new Date();
  for (const action of queued) {
    action.status = 'synced';
    action.syncedAt = now;
    await action.save();
  }
  res.json({ synced: queued.length });
});

router.get('/offline/cache/:patientAddress', async (req, res) => {
  const access = await evaluateRecordReadAccess(req.user, req.params.patientAddress, { context: 'normal' });
  if (!access.allowed) {
    return res.status(access.status || 403).json({ message: access.error || 'Access denied' });
  }

  const latestRecord = await SecureMedicalRecord.findOne({ patient: String(req.params.patientAddress).toLowerCase() }).sort({ createdAt: -1 });
  const queueSize = await OfflineAction.countDocuments({ user: req.user._id, status: 'queued' });

  res.json({
    latestSummary: latestRecord
      ? {
        id: latestRecord._id,
        payloadHash: latestRecord.payloadHash,
        createdAt: latestRecord.createdAt,
      }
      : null,
    queueSize,
    badge: queueSize > 0 ? 'Sync pending' : 'Up to date',
  });
});

router.post('/prescriptions/:id/sign', restrictTo('doctor', 'admin', 'hospital'), async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

  const signMaterial = `${prescription._id}:${prescription.patientEmail}:${prescription.medication}:${req.user.email}`;
  const signature = crypto
    .createHash('sha256')
    .update(`${signMaterial}:${process.env.PRESCRIPTION_SIGNING_SECRET || 'local-dev-secret'}`)
    .digest('hex');

  prescription.doctorSignature = signature;
  prescription.signatureIssuedAt = new Date();
  await prescription.save();

  await recordAudit({
    user: req.user._id,
    action: 'PRESCRIPTION_SIGNED',
    entityType: 'prescription',
    entityId: String(prescription._id),
    metadata: { signature },
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  });

  res.json({ signature, prescription });
});

router.post('/prescriptions/:id/verify-dispense', async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

  if (!prescription.doctorSignature) {
    return res.status(400).json({ valid: false, message: 'Prescription is not doctor-signed' });
  }

  if (prescription.refillsUsed >= prescription.refillsAllowed && prescription.status === 'Fulfilled') {
    prescription.refillBlocked = true;
    await prescription.save();
    return res.status(409).json({ valid: false, message: 'Refill fraud prevention blocked this dispense' });
  }

  const valid = ['Active', 'Requested'].includes(prescription.status);
  if (valid) {
    prescription.refillsUsed = Number(prescription.refillsUsed || 0) + 1;
    prescription.status = 'Fulfilled';
    prescription.lastDispensedAt = new Date();
    prescription.dispenseLogHash = crypto
      .createHash('sha256')
      .update(`${prescription._id}:${prescription.lastDispensedAt.toISOString()}:${req.user.email}`)
      .digest('hex');
    await prescription.save();
  }

  await recordAudit({
    user: req.user._id,
    action: 'PRESCRIPTION_DISPENSE_VERIFIED',
    entityType: 'prescription',
    entityId: String(prescription._id),
    metadata: { valid, dispenseLogHash: prescription.dispenseLogHash, refillBlocked: !!prescription.refillBlocked },
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  });

  res.json({ valid, prescription });
});

router.get(
  '/emergency/facilities',
  [query('lat').optional().isFloat(), query('lng').optional().isFloat()],
  async (req, res) => {
    const facilities = [
      { name: 'City Emergency Center', etaMin: 9, contact: '+1-555-1100' },
      { name: 'Central Trauma Unit', etaMin: 14, contact: '+1-555-1200' },
      { name: 'Rapid Care Hospital', etaMin: 18, contact: '+1-555-1300' },
    ];

    res.json({ facilities, origin: { lat: req.query.lat || null, lng: req.query.lng || null } });
  }
);

router.get('/search', [query('q').isString().notEmpty()], async (req, res) => {
  const q = String(req.query.q).trim();
  const role = String(req.query.role || req.user.role || 'all').toLowerCase();
  const regex = new RegExp(q, 'i');
  const terms = q.split(/\s+/).filter(Boolean);

  const [audits, prescriptions, records] = await Promise.all([
    AuditLog.find({ $or: [{ action: regex }, { entityType: regex }] }).sort({ createdAt: -1 }).limit(20),
    Prescription.find({ $or: [{ medication: regex }, { patientEmail: regex }, { issuedByDoctor: regex }] }).sort({ createdAt: -1 }).limit(20),
    SecureMedicalRecord.find({ $or: [{ payloadHash: regex }, { blockchainTxHash: regex }, { patient: regex }] }).sort({ createdAt: -1 }).limit(20),
  ]);

  const semanticScore = (value) => {
    const text = String(value || '').toLowerCase();
    return terms.reduce((score, term) => (text.includes(term.toLowerCase()) ? score + 1 : score), 0);
  };

  const scoredPrescriptions = prescriptions
    .map((item) => ({ ...item.toObject(), _semanticScore: semanticScore(`${item.medication} ${item.patientEmail} ${item.issuedByDoctor || ''}`) }))
    .sort((a, b) => b._semanticScore - a._semanticScore);

  const roleAware = role === 'admin'
    ? { audits, prescriptions: scoredPrescriptions, records }
    : { audits: audits.filter((item) => !/auth|token/i.test(item.action)), prescriptions: scoredPrescriptions, records };

  res.json({
    query: q,
    role,
    ...roleAware,
  });
});

router.post('/search/saved-filters', [body('name').isString().notEmpty(), body('domain').isString().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const view = await SavedFilterView.create({
    user: req.user._id,
    name: req.body.name,
    domain: req.body.domain,
    filters: req.body.filters || {},
    role: req.user.role,
  });

  res.status(201).json({ view });
});

router.get('/search/saved-filters', async (req, res) => {
  const views = await SavedFilterView.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ views });
});

router.get('/trust/records/:patientAddress', async (req, res) => {
  const context = String(req.query.context || 'normal').toLowerCase();
  const access = await evaluateRecordReadAccess(req.user, req.params.patientAddress, { context });
  if (!access.allowed) {
    return res.status(access.status || 403).json({ message: access.error || 'Access denied' });
  }

  const lastAccess = await AuditLog.findOne({
    entityType: /record|medicalRecord/i,
    entityId: String(req.params.patientAddress).toLowerCase(),
  })
    .sort({ createdAt: -1 })
    .populate('user', 'email role');

  const records = await SecureMedicalRecord.find({ patient: String(req.params.patientAddress).toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    records: records.map((item) => ({
      id: item._id,
      payloadHash: item.payloadHash,
      createdAt: item.createdAt,
      trust: {
        whyAllowed: context === 'emergency' ? 'Context-aware policy check passed' : 'Patient consent policy check passed',
        allowedBy: 'consent-or-policy',
        consentId: access.consentId ? String(access.consentId) : null,
        lastAccessedBy: lastAccess?.user?.email || null,
        lastAccessedAt: lastAccess?.createdAt || null,
      },
    })),
  });
});

module.exports = router;
