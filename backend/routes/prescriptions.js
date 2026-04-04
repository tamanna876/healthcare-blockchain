const express = require('express');
const { body, validationResult } = require('express-validator');
const Prescription = require('../models/Prescription');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/prescriptions – patients see their own, doctors and pharmacies see all
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'patient') {
      filter.patientEmail = req.user.email;
    }
    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });
    res.json({ prescriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/prescriptions – doctor issues a prescription (or patient requests refill)
router.post(
  '/',
  [
    body('medication').notEmpty().withMessage('Medication is required'),
    body('dosage').notEmpty().withMessage('Dosage is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      patientEmail,
      medication,
      dosage,
      frequency,
      durationDays,
      pharmacy,
      refillsAllowed,
      notes,
    } = req.body;

    // Doctors specify patientEmail; patients create for themselves
    const targetEmail =
      req.user.role === 'doctor' && patientEmail ? patientEmail : req.user.email;

    try {
      const prescription = await Prescription.create({
        patientEmail: targetEmail,
        patientId: req.user._id,
        issuedByDoctor: req.user.role === 'doctor' ? req.user.displayName || req.user.email : undefined,
        medication,
        dosage,
        frequency,
        durationDays,
        pharmacy,
        refillsAllowed,
        status: req.user.role === 'doctor' ? 'Active' : 'Requested',
        notes,
      });
      res.status(201).json({ prescription });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/prescriptions/:id/status – pharmacy fulfills, doctor or admin updates
router.patch(
  '/:id/status',
  restrictTo('doctor', 'pharmacy', 'admin'),
  [body('status').isIn(['Active', 'Requested', 'Fulfilled', 'Expired', 'Cancelled'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const prescription = await Prescription.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { returnDocument: 'after' }
      );
      if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
      res.json({ prescription });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
