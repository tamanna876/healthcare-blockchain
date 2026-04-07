const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { create } = require('ipfs-http-client');
const { protect, restrictTo } = require('../middleware/auth');
const { canReadPatientRecords, evaluateRecordReadAccess } = require('../middleware/recordAccess');
const { getBlockchainClients } = require('../services/blockchain');
const { recordAudit } = require('../services/audit');
const encryptionService = require('../services/encryption');
const SecureMedicalRecord = require('../models/SecureMedicalRecord');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

function getIpfs() {
  return create({
    host: process.env.IPFS_HOST,
    port: Number(process.env.IPFS_PORT),
    protocol: process.env.IPFS_PROTOCOL,
  });
}

// POST /api/records/upload – upload file to IPFS
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const ipfs = getIpfs();
    const fileBuffer = fs.readFileSync(req.file.path);
    const result = await ipfs.add(fileBuffer);
    fs.unlinkSync(req.file.path);
    await recordAudit({
      user: req.user?._id || null,
      action: 'MEDICAL_FILE_UPLOADED',
      entityType: 'record',
      entityId: result.path,
      metadata: { fileName: req.file.originalname, mimetype: req.file.mimetype },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });
    res.json({ message: 'File uploaded to IPFS', ipfsHash: result.path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/records – store record on blockchain
router.post('/', protect, restrictTo('doctor', 'hospital', 'admin'), async (req, res) => {
  const { patient, ipfsHash } = req.body;
  if (!patient || !ipfsHash) {
    return res.status(400).json({ error: 'patient address and ipfsHash are required' });
  }

  try {
    const { medicalRecords } = getBlockchainClients();
    const tx = await medicalRecords.addRecord(patient, ipfsHash);
    await tx.wait();
    await recordAudit({
      user: req.user?._id || null,
      action: 'MEDICAL_RECORD_CREATED',
      entityType: 'record',
      entityId: ipfsHash,
      metadata: { patient, txHash: tx.hash },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });
    res.json({ message: 'Record stored on blockchain', txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/records/secure – encrypt payload off-chain + hash on-chain
router.post('/secure', protect, restrictTo('doctor', 'hospital', 'admin'), async (req, res) => {
  const { patient, payload, ipfsHash } = req.body;
  if (!patient || !payload) {
    return res.status(400).json({ error: 'patient and payload are required' });
  }

  const encryptionKey = process.env.ENCRYPTION_MASTER_KEY || process.env.JWT_SECRET;
  if (!encryptionKey) {
    return res.status(500).json({ error: 'ENCRYPTION_MASTER_KEY not configured' });
  }

  try {
    const encryptedPayload = encryptionService.encrypt(payload, encryptionKey);
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    const { medicalRecords } = getBlockchainClients();
    const tx = await medicalRecords.addRecord(patient, payloadHash);
    await tx.wait();

    const secureRecord = await SecureMedicalRecord.create({
      patient,
      ownerEmail: req.user.email,
      encryptedPayload,
      payloadHash,
      ipfsHash,
      blockchainTxHash: tx.hash,
    });

    await recordAudit({
      user: req.user._id,
      action: 'SECURE_MEDICAL_RECORD_CREATED',
      entityType: 'secureRecord',
      entityId: String(secureRecord._id),
      metadata: { patient, payloadHash, txHash: tx.hash },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.status(201).json({
      message: 'Secure record stored off-chain with blockchain hash reference',
      recordId: secureRecord._id,
      payloadHash,
      txHash: tx.hash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/records/secure/:patient – list secure records without exposing encrypted content
router.get('/secure/:patient', protect, canReadPatientRecords, async (req, res) => {
  try {
    const records = await SecureMedicalRecord.find({ patient: req.params.patient }).sort({ createdAt: -1 });
    const masked = records.map((item) => ({
      id: item._id,
      patient: item.patient,
      ownerEmail: item.ownerEmail,
      payloadHash: item.payloadHash,
      ipfsHash: item.ipfsHash,
      blockchainTxHash: item.blockchainTxHash,
      createdAt: item.createdAt,
    }));

    await recordAudit({
      user: req.user?._id || null,
      action: 'SECURE_MEDICAL_RECORDS_VIEWED',
      entityType: 'secureRecord',
      entityId: req.params.patient,
      metadata: {
        count: masked.length,
        consentId: req.recordAccess?.consentId ? String(req.recordAccess.consentId) : null,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.json({ records: masked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/records/secure/:id/verify – recompute payload hash and compare
router.post('/secure/:id/verify', protect, async (req, res) => {
  const { payload } = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'payload is required' });
  }

  try {
    const secureRecord = await SecureMedicalRecord.findById(req.params.id);
    if (!secureRecord) {
      return res.status(404).json({ error: 'Secure record not found' });
    }

    const access = await evaluateRecordReadAccess(req.user, secureRecord.patient);
    if (!access.allowed) {
      return res.status(access.status || 403).json({ error: access.error || 'Access denied' });
    }

    const computedHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const isValid = computedHash === secureRecord.payloadHash;

    await recordAudit({
      user: req.user._id,
      action: 'SECURE_MEDICAL_RECORD_VERIFIED',
      entityType: 'secureRecord',
      entityId: String(secureRecord._id),
      metadata: {
        isValid,
        consentId: access?.consentId ? String(access.consentId) : null,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.json({
      isValid,
      computedHash,
      payloadHash: secureRecord.payloadHash,
      blockchainTxHash: secureRecord.blockchainTxHash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/records/:patient – fetch records from blockchain
router.get('/:patient', protect, canReadPatientRecords, async (req, res) => {
  try {
    const { medicalRecords } = getBlockchainClients();
    const records = await medicalRecords.getRecords(req.params.patient);
    const formatted = records.map((r) => ({
      ipfsHash: r.ipfsHash,
      doctor: r.doctor,
      timestamp: Number(r.timestamp),
    }));
    await recordAudit({
      user: req.user?._id || null,
      action: 'MEDICAL_RECORDS_VIEWED',
      entityType: 'record',
      entityId: req.params.patient,
      metadata: {
        count: formatted.length,
        consentId: req.recordAccess?.consentId ? String(req.recordAccess.consentId) : null,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });
    res.json({ records: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
