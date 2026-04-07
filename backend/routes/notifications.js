const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, restrictTo } = require('../middleware/auth');
const notificationService = require('../services/notifications');
const User = require('../models/User');

const router = express.Router();

router.use(protect);

router.post(
  '/subscribe',
  [body('recipient').notEmpty().withMessage('recipient is required')],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient, preferences = {} } = req.body;
    const result = notificationService.subscribe(recipient, {
      email: preferences.email || req.user.email,
      phone: preferences.phone,
      bloodDonationAlerts: preferences.bloodDonationAlerts,
      organDonationAlerts: preferences.organDonationAlerts,
      emergencyAlerts: preferences.emergencyAlerts,
      certificateAlerts: preferences.certificateAlerts,
    });

    return res.json(result);
  }
);

router.get('/me', (req, res) => {
  const notifications = notificationService.getUserNotifications(req.user.email, req.query.unreadOnly === 'true');
  res.json({ notifications, total: notifications.length });
});

router.post('/:notificationId/read', (req, res) => {
  const success = notificationService.markAsRead(Number(req.params.notificationId));
  res.json({ success });
});

router.post('/read-all', (req, res) => {
  const notifications = notificationService.getUserNotifications(req.user.email, true);
  let updated = 0;

  for (const item of notifications) {
    if (notificationService.markAsRead(Number(item.id))) {
      updated += 1;
    }
  }

  res.json({ success: true, updated });
});

router.post('/test/blood', restrictTo('admin', 'doctor', 'hospital'), async (req, res) => {
  const { bloodGroup, location, urgencyLevel = 3 } = req.body;
  const notifications = await notificationService.notifyBloodDonors(bloodGroup, location, { bloodGroup, location, urgencyLevel });
  res.json({ notificationsSent: notifications.length, notifications });
});

router.get('/preferences', async (req, res) => {
  const user = await User.findById(req.user._id).select('notificationPreferences email phone');
  res.json({
    notificationPreferences: user.notificationPreferences || {},
    channels: { email: user.email, phone: user.phone || null },
  });
});

router.put('/preferences', async (req, res) => {
  const allowedKeys = [
    'email',
    'sms',
    'inApp',
    'bloodDonationAlerts',
    'organDonationAlerts',
    'emergencyAlerts',
    'certificateAlerts',
  ];

  const next = {};
  for (const key of allowedKeys) {
    if (typeof req.body?.[key] === 'boolean') {
      next[`notificationPreferences.${key}`] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: next }, { returnDocument: 'after' })
    .select('notificationPreferences');
  res.json({ notificationPreferences: user.notificationPreferences || {} });
});

module.exports = router;