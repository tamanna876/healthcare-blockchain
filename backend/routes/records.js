const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { create } = require('ipfs-http-client');
const { protect } = require('../middleware/auth');
const { getBlockchainClients } = require('../services/blockchain');

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
    res.json({ message: 'File uploaded to IPFS', ipfsHash: result.path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/records – store record on blockchain
router.post('/', protect, async (req, res) => {
  const { patient, ipfsHash } = req.body;
  if (!patient || !ipfsHash) {
    return res.status(400).json({ error: 'patient address and ipfsHash are required' });
  }

  try {
    const { medicalRecords } = getBlockchainClients();
    const tx = await medicalRecords.addRecord(patient, ipfsHash);
    await tx.wait();
    res.json({ message: 'Record stored on blockchain', txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/records/:patient – fetch records from blockchain
router.get('/:patient', protect, async (req, res) => {
  try {
    const { medicalRecords } = getBlockchainClients();
    const records = await medicalRecords.getRecords(req.params.patient);
    const formatted = records.map((r) => ({
      ipfsHash: r.ipfsHash,
      doctor: r.doctor,
      timestamp: Number(r.timestamp),
    }));
    res.json({ records: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
