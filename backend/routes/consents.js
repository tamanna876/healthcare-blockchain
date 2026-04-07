const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const ConsentGrant = require('../models/ConsentGrant');
const { recordAudit } = require('../services/audit');

const router = express.Router();

router.use(protect);

function mapWithComputedStatus(item) {
  const now = Date.now();
  const expiresAt = new Date(item.expiresAt).getTime();
  const shouldExpire = item.status === 'active' && Number.isFinite(expiresAt) && expiresAt < now;

  return {
    id: item._id,
    ownerEmail: item.ownerEmail,
    granteeType: item.granteeType,
    granteeName: item.granteeName,
    granteeIdentifier: item.granteeIdentifier,
    permissions: item.permissions || [],
    contexts: item.contexts || ['normal'],
    breakGlassAllowed: !!item.breakGlassAllowed,
    status: shouldExpire ? 'expired' : item.status,
    grantedAt: item.grantedAt,
    expiresAt: item.expiresAt,
    autoRevokeAt: item.autoRevokeAt,
    revokedAt: item.revokedAt,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
  };
}

router.get('/mine', async (req, res) => {
  try {
    const grants = await ConsentGrant.find({ ownerEmail: req.user.email }).sort({ createdAt: -1 });
    const computed = grants.map(mapWithComputedStatus);
    res.json({ grants: computed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  '/',
  [
    body('granteeType').isIn(['doctor', 'family']),
    body('granteeName').isString().trim().notEmpty(),
    body('granteeIdentifier').isString().trim().notEmpty(),
    body('permissions').isArray({ min: 1 }),
    body('contexts').optional().isArray({ min: 1 }),
    body('breakGlassAllowed').optional().isBoolean(),
    body('autoRevokeAt').optional().isISO8601(),
    body('expiresAt').isISO8601().withMessage('expiresAt must be a valid date'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const expiresAt = new Date(req.body.expiresAt);
      if (expiresAt.getTime() <= Date.now()) {
        return res.status(400).json({ message: 'expiresAt must be in the future' });
      }

      const grant = await ConsentGrant.create({
        owner: req.user._id,
        ownerEmail: req.user.email,
        granteeType: req.body.granteeType,
        granteeName: req.body.granteeName,
        granteeIdentifier: req.body.granteeIdentifier,
        permissions: req.body.permissions,
        contexts: Array.isArray(req.body.contexts) && req.body.contexts.length > 0
          ? req.body.contexts
          : ['normal'],
        breakGlassAllowed: !!req.body.breakGlassAllowed,
        expiresAt,
        autoRevokeAt: req.body.autoRevokeAt ? new Date(req.body.autoRevokeAt) : null,
      });

      await recordAudit({
        user: req.user._id,
        action: 'CONSENT_GRANTED',
        entityType: 'consent',
        entityId: String(grant._id),
        metadata: {
          granteeType: grant.granteeType,
          granteeIdentifier: grant.granteeIdentifier,
          permissions: grant.permissions,
          contexts: grant.contexts,
          breakGlassAllowed: grant.breakGlassAllowed,
          autoRevokeAt: grant.autoRevokeAt,
          expiresAt: grant.expiresAt,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      });

      res.status(201).json({ grant: mapWithComputedStatus(grant) });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post('/:id/revoke', async (req, res) => {
  try {
    const grant = await ConsentGrant.findOne({ _id: req.params.id, ownerEmail: req.user.email });
    if (!grant) {
      return res.status(404).json({ message: 'Consent grant not found' });
    }

    if (grant.status === 'revoked') {
      return res.json({ grant: mapWithComputedStatus(grant) });
    }

    grant.status = 'revoked';
    grant.revokedAt = new Date();
    await grant.save();

    await recordAudit({
      user: req.user._id,
      action: 'CONSENT_REVOKED',
      entityType: 'consent',
      entityId: String(grant._id),
      metadata: { granteeIdentifier: grant.granteeIdentifier },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.json({ grant: mapWithComputedStatus(grant) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/extend', [body('expiresAt').isISO8601()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const grant = await ConsentGrant.findOne({ _id: req.params.id, ownerEmail: req.user.email });
    if (!grant) {
      return res.status(404).json({ message: 'Consent grant not found' });
    }

    if (grant.status === 'revoked') {
      return res.status(400).json({ message: 'Cannot extend a revoked consent' });
    }

    const nextExpiry = new Date(req.body.expiresAt);
    if (nextExpiry.getTime() <= Date.now()) {
      return res.status(400).json({ message: 'expiresAt must be in the future' });
    }

    grant.expiresAt = nextExpiry;
    grant.status = 'active';
    await grant.save();

    await recordAudit({
      user: req.user._id,
      action: 'CONSENT_EXTENDED',
      entityType: 'consent',
      entityId: String(grant._id),
      metadata: { expiresAt: grant.expiresAt },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.json({ grant: mapWithComputedStatus(grant) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
