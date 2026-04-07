const express = require('express');
const User = require('../models/User');
const BloodDonor = require('../models/BloodDonor');
const OrganDonor = require('../models/OrganDonor');
const Medicine = require('../models/Medicine');
const ClinicalTrial = require('../models/ClinicalTrial');
const AuditLog = require('../models/AuditLog');
const EmergencyAlert = require('../models/EmergencyAlert');
const { protect, restrictTo } = require('../middleware/auth');
const { getObservabilitySnapshot } = require('../services/telemetry');

const router = express.Router();

router.get('/metrics', protect, restrictTo('admin'), async (_req, res) => {
  try {
    const [users, bloodDonors, organDonors, medicines, trials, auditLogs] = await Promise.all([
      User.countDocuments(),
      BloodDonor.countDocuments(),
      OrganDonor.countDocuments(),
      Medicine.countDocuments(),
      ClinicalTrial.countDocuments(),
      AuditLog.countDocuments(),
    ]);

    res.json({
      users,
      bloodDonors,
      organDonors,
      medicines,
      trials,
      auditLogs,
      activeNodes: 1,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/audit-logs', protect, restrictTo('admin'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit).populate('user', 'email role displayName');
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/observability', protect, restrictTo('admin'), async (_req, res) => {
  try {
    const telemetry = getObservabilitySnapshot();
    const [
      openEmergencyAlerts,
      criticalEmergencyAlerts,
      failedActions,
      todayAuditEvents,
    ] = await Promise.all([
      EmergencyAlert.countDocuments({ status: 'open' }),
      EmergencyAlert.countDocuments({ urgency: 'critical', status: { $ne: 'closed' } }),
      AuditLog.countDocuments({ action: /FAILED|ERROR|REJECTED/i }),
      AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ]);

    res.json({
      openEmergencyAlerts,
      criticalEmergencyAlerts,
      failedActions,
      todayAuditEvents,
      activeNodes: Number(process.env.ACTIVE_NODE_COUNT || 1),
      blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'configured-rpc',
      apiLatencyMs: telemetry.avgLatencyMs,
      apiErrorRate: telemetry.errorRate,
      authFailures: telemetry.authFailures,
      requestsTotal: telemetry.requestsTotal,
      topRoutes: telemetry.topRoutes,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;