const express = require('express');
const { body, query, validationResult } = require('express-validator');
const SupportProgram = require('../models/SupportProgram');
const WomenHealthReminder = require('../models/WomenHealthReminder');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/support-programs',
  protect,
  [query('providerType').optional().isIn(['state', 'central', 'who'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const filter = {};
      if (req.query.providerType) filter.providerType = req.query.providerType;
      const programs = await SupportProgram.find(filter).sort({ createdAt: -1 });
      res.json({ programs });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.post(
  '/support-programs',
  protect,
  restrictTo('admin'),
  [
    body('providerType').isIn(['state', 'central', 'who']),
    body('provider').notEmpty(),
    body('programName').notEmpty(),
    body('support').notEmpty(),
    body('link').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const program = await SupportProgram.create({
        ...req.body,
        coverage: Number(req.body.coverage) || 0,
        accessSteps: Array.isArray(req.body.accessSteps) ? req.body.accessSteps : [],
        createdBy: req.user._id,
      });
      res.status(201).json({ program });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.put(
  '/support-programs/:id',
  protect,
  restrictTo('admin'),
  [
    body('providerType').optional().isIn(['state', 'central', 'who']),
    body('coverage').optional().isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updates = {
        ...req.body,
      };

      if (updates.coverage !== undefined) {
        updates.coverage = Number(updates.coverage) || 0;
      }

      if (updates.accessSteps && !Array.isArray(updates.accessSteps)) {
        updates.accessSteps = [];
      }

      const program = await SupportProgram.findByIdAndUpdate(req.params.id, updates, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!program) {
        return res.status(404).json({ message: 'Support program not found' });
      }

      res.json({ program });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.delete('/support-programs/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const program = await SupportProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Support program not found' });
    }

    await program.deleteOne();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/women-reminders', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { patientEmail: req.user.email };

    if (req.query.patientEmail && isAdmin) {
      filter.patientEmail = req.query.patientEmail.toLowerCase();
    }

    const reminders = await WomenHealthReminder.find(filter).sort({ reminderDate: 1, createdAt: -1 });
    res.json({ reminders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  '/women-reminders',
  protect,
  [
    body('stage').notEmpty(),
    body('goal').notEmpty(),
    body('reminderType').notEmpty(),
    body('reminderDate').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const reminder = await WomenHealthReminder.create({
        patientEmail: req.user.email,
        patientId: req.user._id,
        language: req.body.language || 'en',
        stage: req.body.stage,
        goal: req.body.goal,
        reminderType: req.body.reminderType,
        reminderDate: req.body.reminderDate,
        notes: req.body.notes || '',
      });
      res.status(201).json({ reminder });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.put(
  '/women-reminders/:id',
  protect,
  [
    body('language').optional().isString(),
    body('stage').optional().isString(),
    body('goal').optional().isString(),
    body('reminderType').optional().isString(),
    body('reminderDate').optional().isISO8601(),
    body('notes').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const reminder = await WomenHealthReminder.findById(req.params.id);
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      const isOwner = reminder.patientEmail === req.user.email;
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Not authorised to update this reminder' });
      }

      Object.assign(reminder, req.body);
      await reminder.save();
      res.json({ reminder });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.delete('/women-reminders/:id', protect, async (req, res) => {
  try {
    const reminder = await WomenHealthReminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    const isOwner = reminder.patientEmail === req.user.email;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorised to delete this reminder' });
    }

    await reminder.deleteOne();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/analytics', protect, restrictTo('admin'), async (_req, res) => {
  try {
    const [supportPrograms, womenReminders] = await Promise.all([
      SupportProgram.find().lean(),
      WomenHealthReminder.find().lean(),
    ]);

    const providerBreakdown = supportPrograms.reduce((acc, program) => {
      acc[program.providerType] = (acc[program.providerType] || 0) + 1;
      return acc;
    }, {});

    const stageBreakdown = womenReminders.reduce((acc, reminder) => {
      acc[reminder.stage] = (acc[reminder.stage] || 0) + 1;
      return acc;
    }, {});

    const monthlyReminderCounts = womenReminders.reduce((acc, reminder) => {
      const key = new Date(reminder.reminderDate).toISOString().slice(0, 7);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const monthlySupportCounts = supportPrograms.reduce((acc, program) => {
      const key = new Date(program.createdAt).toISOString().slice(0, 7);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const goalBreakdown = womenReminders.reduce((acc, reminder) => {
      acc[reminder.goal] = (acc[reminder.goal] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totals: {
        supportPrograms: supportPrograms.length,
        womenReminders: womenReminders.length,
      },
      providerBreakdown,
      stageBreakdown,
      goalBreakdown,
      monthlyReminderCounts,
      monthlySupportCounts,
      latestSupportPrograms: supportPrograms
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10),
      latestWomenReminders: womenReminders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;