const express = require('express');
const { body, validationResult } = require('express-validator');
const ClinicalTrial = require('../models/ClinicalTrial');
const { protect, restrictTo } = require('../middleware/auth');
const { recordAudit } = require('../services/audit');

const router = express.Router();

// GET /api/trials
router.get('/', protect, async (req, res) => {
  try {
    const { status, phase } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (phase) filter.phase = phase;

    const trials = await ClinicalTrial.find(filter).sort({ createdAt: -1 });
    res.json({ trials });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trials/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const trial = await ClinicalTrial.findById(req.params.id);
    if (!trial) return res.status(404).json({ message: 'Trial not found' });
    res.json({ trial });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trials – hospital or admin creates a trial
router.post(
  '/',
  protect,
  restrictTo('hospital', 'admin', 'doctor'),
  [
    body('trialName').notEmpty().withMessage('Trial name is required'),
    body('trialId').notEmpty().withMessage('Trial ID is required'),
    body('researcher').notEmpty().withMessage('Researcher is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const existing = await ClinicalTrial.findOne({ trialId: req.body.trialId });
      if (existing) return res.status(400).json({ message: 'Trial ID already exists' });

      const trial = await ClinicalTrial.create(req.body);
      await recordAudit({
        user: req.user._id,
        action: 'CLINICAL_TRIAL_CREATED',
        entityType: 'clinicalTrial',
        entityId: trial.trialId,
        metadata: { trialName: trial.trialName, status: trial.status, phase: trial.phase },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      });
      res.status(201).json({ trial });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/trials/:id/status – update trial status
router.patch(
  '/:id/status',
  protect,
  restrictTo('hospital', 'admin', 'doctor'),
  [body('status').isIn(['Recruiting', 'Active', 'Completed', 'Suspended', 'Terminated'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const trial = await ClinicalTrial.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status, resultData: req.body.resultData },
        { returnDocument: 'after' }
      );
      if (!trial) return res.status(404).json({ message: 'Trial not found' });
      await recordAudit({
        user: req.user._id,
        action: 'CLINICAL_TRIAL_STATUS_UPDATED',
        entityType: 'clinicalTrial',
        entityId: String(trial._id),
        metadata: { status: req.body.status },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      });
      res.json({ trial });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
