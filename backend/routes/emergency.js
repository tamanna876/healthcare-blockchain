const express = require('express');
const { body, validationResult } = require('express-validator');
const EmergencyAlert = require('../models/EmergencyAlert');
const BloodDonor = require('../models/BloodDonor');
const OrganDonor = require('../models/OrganDonor');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const { recordAudit } = require('../services/audit');
const notificationService = require('../services/notifications');
const { publishLiveAlert } = require('../services/liveAlertsHub');

const router = express.Router();

function distanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

router.post(
  '/sos',
  protect,
  [
    body('message').notEmpty().withMessage('message is required'),
    body('type').optional().isIn(['blood', 'organ', 'general']),
    body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('location').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);

      const alert = await EmergencyAlert.create({
        user: req.user._id,
        type: req.body.type || 'general',
        location: req.body.location,
        message: req.body.message,
        urgency: req.body.urgency || 'high',
        workflowLog: [{ state: 'sent', by: req.user._id, at: new Date(), note: 'SOS created' }],
      });

      let nearbyDonors = [];
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        const candidates = req.body.type === 'organ'
          ? await OrganDonor.find({ isActive: true }).limit(200)
          : await BloodDonor.find({ isAvailable: true }).limit(200);

        nearbyDonors = candidates
          .filter((donor) => Number.isFinite(donor.latitude) && Number.isFinite(donor.longitude))
          .map((donor) => ({
            donor,
            distanceKm: distanceInKm(latitude, longitude, donor.latitude, donor.longitude),
          }))
          .filter((entry) => entry.distanceKm <= Number(process.env.SOS_DONOR_RADIUS_KM || 50))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 10)
          .map((entry) => ({
            id: entry.donor._id,
            name: entry.donor.name,
            bloodGroup: entry.donor.bloodGroup,
            organType: entry.donor.organType,
            location: entry.donor.location,
            phone: entry.donor.phone,
            distanceKm: Number(entry.distanceKm.toFixed(2)),
            confidenceScore: Math.max(10, Math.round((1 - Math.min(entry.distanceKm, 50) / 50) * 100)),
          }));
      }

      await notificationService.sendEmergencyAlert(req.user.walletAddress || req.user.email, {
        alertId: String(alert._id),
        message: req.body.message,
        type: req.body.type || 'general',
        urgency: req.body.urgency || 'high',
        location: req.body.location,
      });

      publishLiveAlert({
        type: 'emergency-sos',
        priority: 'CRITICAL',
        payload: {
          alertId: String(alert._id),
          message: alert.message,
          urgency: alert.urgency,
        },
      });

      let escalationNotified = [];
      if (nearbyDonors.length > 0) {
        for (const donor of nearbyDonors) {
          await notificationService.sendEmergencyAlert(donor.phone || donor.name, {
            alertId: String(alert._id),
            message: req.body.message,
            type: req.body.type || 'general',
            urgency: req.body.urgency || 'high',
            location: req.body.location,
            confidenceScore: donor.confidenceScore,
          });
        }
        escalationNotified = ['donor'];
      } else {
        const escalatedUsers = await User.find({ role: { $in: ['hospital', 'admin'] }, isActive: true })
          .limit(20)
          .select('email role displayName');

        for (const escalatedUser of escalatedUsers) {
          await notificationService.sendEmergencyAlert(escalatedUser.email, {
            alertId: String(alert._id),
            message: req.body.message,
            type: req.body.type || 'general',
            urgency: req.body.urgency || 'high',
            location: req.body.location,
            escalationTargetRole: escalatedUser.role,
          });
        }

        escalationNotified = ['hospital', 'admin'];
      }

      await recordAudit({
        user: req.user._id,
        action: 'EMERGENCY_SOS_CREATED',
        entityType: 'emergencyAlert',
        entityId: String(alert._id),
        metadata: {
          type: alert.type,
          urgency: alert.urgency,
          location: alert.location,
          nearbyDonors: nearbyDonors.length,
          escalationNotified,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      });

      res.status(201).json({ alert, nearbyDonors, escalationNotified });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/', protect, restrictTo('admin', 'doctor', 'hospital'), async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find().sort({ createdAt: -1 }).populate('user', 'email role displayName');
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;