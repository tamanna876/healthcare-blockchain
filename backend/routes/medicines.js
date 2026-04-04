const express = require('express');
const { body, validationResult } = require('express-validator');
const Medicine = require('../models/Medicine');
const { protect, restrictTo } = require('../middleware/auth');
const { getBlockchainClients } = require('../services/blockchain');

const router = express.Router();

// GET /api/medicines – list all registered medicines
router.get('/', async (req, res) => {
  try {
    const { name, manufacturer } = req.query;
    const filter = {};
    if (name) filter.name = new RegExp(name, 'i');
    if (manufacturer) filter.manufacturer = new RegExp(manufacturer, 'i');

    const medicines = await Medicine.find(filter).sort({ createdAt: -1 });
    res.json({ medicines });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/medicines/verify/:medicineId – verify a medicine on blockchain + DB
router.get('/verify/:medicineId', async (req, res) => {
  const { medicineId } = req.params;

  try {
    const medicine = await Medicine.findOne({ medicineId });

    // Try blockchain verification
    let blockchainVerified = false;
    try {
      const { medicineVerification } = getBlockchainClients();
      blockchainVerified = await medicineVerification.verifyMedicine(medicineId);
    } catch {
      // Blockchain node offline – fall through to DB-only check
    }

    if (medicine) {
      return res.json({
        authentic: true,
        source: blockchainVerified ? 'blockchain+db' : 'db',
        message: 'Medicine verified in registry',
        details: medicine,
      });
    }

    res.json({
      authentic: false,
      source: 'none',
      message: 'Medicine not found in decentralised registry',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/medicines – pharmacy or admin registers a medicine
router.post(
  '/',
  protect,
  restrictTo('pharmacy', 'admin'),
  [
    body('medicineId').notEmpty().withMessage('Medicine ID is required'),
    body('name').notEmpty().withMessage('Medicine name is required'),
    body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
    body('batchNumber').notEmpty().withMessage('Batch number is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { medicineId, name, manufacturer, batchNumber, manufactureDate, expiryDate, compositionTags } =
      req.body;

    try {
      const existing = await Medicine.findOne({ medicineId });
      if (existing) return res.status(400).json({ message: 'Medicine ID already registered' });

      let txHash;
      try {
        const { medicineVerification } = getBlockchainClients();
        const tx = await medicineVerification.registerMedicine(medicineId, name, manufacturer);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      } catch (blockchainErr) {
        console.warn('Blockchain registration skipped:', blockchainErr.message);
      }

      const medicine = await Medicine.create({
        medicineId,
        name,
        manufacturer,
        batchNumber,
        manufactureDate,
        expiryDate,
        compositionTags,
        txHash,
        isVerified: !!txHash,
      });

      res.status(201).json({ medicine });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/medicines/:id/recall – admin marks a medicine as recalled
router.patch('/:id/recall', protect, restrictTo('admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isRecalled: true },
      { returnDocument: 'after' }
    );
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    res.json({ medicine });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
