const express = require('express');
const { body, validationResult } = require('express-validator');
const BloodDonor = require('../models/BloodDonor');
const OrganDonor = require('../models/OrganDonor');
const { protect, restrictTo } = require('../middleware/auth');
const { getBlockchainClients } = require('../services/blockchain');

const router = express.Router();

/* ─────────────── BLOOD DONORS ─────────────── */

// GET /api/donors/blood
router.get('/blood', async (req, res) => {
  try {
    const { bloodGroup, location } = req.query;
    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (location) filter.location = new RegExp(location, 'i');

    const donors = await BloodDonor.find(filter).sort({ createdAt: -1 });
    res.json({ donors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/donors/blood
router.post(
  '/blood',
  protect,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('bloodGroup')
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood group'),
    body('location').notEmpty().withMessage('Location is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, bloodGroup, location, phone, donatedBefore, lastDonationDate } = req.body;

    try {
      let txHash;
      // Try blockchain registration (graceful degradation if node is offline)
      try {
        const { bloodDonation } = getBlockchainClients();
        const tx = await bloodDonation.registerDonor(name, bloodGroup, location);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      } catch (blockchainErr) {
        console.warn('Blockchain registration skipped:', blockchainErr.message);
      }

      const donor = await BloodDonor.create({
        name,
        bloodGroup,
        location,
        phone,
        email: req.user.email,
        donatedBefore,
        lastDonationDate,
        txHash,
      });

      res.status(201).json({ donor });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/* ─────────────── ORGAN DONORS ─────────────── */

// GET /api/donors/organ
router.get('/organ', async (req, res) => {
  try {
    const { organType, bloodGroup } = req.query;
    const filter = {};
    if (organType) filter.organType = organType;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const donors = await OrganDonor.find(filter).sort({ createdAt: -1 });
    res.json({ donors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/donors/organ
router.post(
  '/organ',
  protect,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('organType')
      .isIn(['Kidney', 'Liver', 'Heart', 'Lungs', 'Cornea', 'Pancreas', 'Intestine', 'Bone Marrow'])
      .withMessage('Invalid organ type'),
    body('bloodGroup')
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood group'),
    body('location').notEmpty().withMessage('Location is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, organType, bloodGroup, location, phone } = req.body;

    try {
      let txHash;
      try {
        const { organDonation } = getBlockchainClients();
        const tx = await organDonation.registerDonor(name, organType, bloodGroup, location);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      } catch (blockchainErr) {
        console.warn('Blockchain registration skipped:', blockchainErr.message);
      }

      const donor = await OrganDonor.create({
        name,
        organType,
        bloodGroup,
        location,
        phone,
        email: req.user.email,
        txHash,
      });

      res.status(201).json({ donor });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
