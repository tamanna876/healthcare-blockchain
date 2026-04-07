const AuditLog = require('../models/AuditLog');

async function recordAudit({ user = null, action, entityType, entityId = null, metadata = {}, ipAddress = null, userAgent = null }) {
  try {
    await AuditLog.create({
      user,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.warn('Audit log write failed:', error.message);
  }
}

module.exports = { recordAudit };