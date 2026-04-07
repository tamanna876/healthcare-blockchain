const User = require('../models/User');
const ConsentGrant = require('../models/ConsentGrant');

function normalize(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

async function expireConsents(ownerId) {
  const now = new Date();
  await ConsentGrant.updateMany(
    {
      owner: ownerId,
      status: 'active',
      expiresAt: { $lte: now },
    },
    {
      $set: {
        status: 'expired',
        revokedAt: now,
      },
    }
  );

  await ConsentGrant.updateMany(
    {
      owner: ownerId,
      status: 'active',
      autoRevokeAt: { $lte: now },
    },
    {
      $set: {
        status: 'revoked',
        revokedAt: now,
      },
    }
  );
}

async function evaluateRecordReadAccess(reqUser, patientAddress, options = {}) {
  const context = normalize(options.context) || 'normal';
  const normalizedPatientAddress = normalize(patientAddress);
  if (!normalizedPatientAddress) {
    return { allowed: false, status: 400, error: 'patient address is required' };
  }

  if (reqUser.role === 'admin') {
    return { allowed: true, ownerUserId: null, consentId: null };
  }

  const requesterWallet = normalize(reqUser.walletAddress);
  if (reqUser.role === 'patient' && requesterWallet && requesterWallet === normalizedPatientAddress) {
    return { allowed: true, ownerUserId: null, consentId: null };
  }

  const owner = await User.findOne({ walletAddress: normalizedPatientAddress }).select('_id walletAddress email');
  if (!owner) {
    return { allowed: false, status: 403, error: 'No patient record owner found for this address' };
  }

  await expireConsents(owner._id);

  const candidateIdentifiers = [normalize(reqUser.email), requesterWallet].filter(Boolean);
  if (candidateIdentifiers.length === 0) {
    return { allowed: false, status: 403, error: 'No valid identity to evaluate consent access' };
  }

  const now = new Date();
  const activeConsent = await ConsentGrant.findOne({
    owner: owner._id,
    status: 'active',
    expiresAt: { $gt: now },
    permissions: 'view-records',
    contexts: context,
    granteeIdentifier: { $in: candidateIdentifiers },
  }).select('_id ownerEmail granteeIdentifier permissions expiresAt');

  if (!activeConsent) {
    return {
      allowed: false,
      status: 403,
      error: 'Access denied. Active patient consent is required to read records.',
    };
  }

  return { allowed: true, ownerUserId: owner._id, consentId: activeConsent._id };
}

async function canReadPatientRecords(req, res, next) {
  const result = await evaluateRecordReadAccess(req.user, req.params.patient, { context: 'normal' });
  if (!result.allowed) {
    return res.status(result.status || 403).json({ error: result.error || 'Access denied' });
  }

  req.recordAccess = {
    ownerUserId: result.ownerUserId,
    consentId: result.consentId,
  };

  return next();
}

module.exports = { canReadPatientRecords, evaluateRecordReadAccess };
