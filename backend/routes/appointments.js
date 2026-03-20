const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All appointment routes require authentication
router.use(protect);

// GET /api/appointments – patients see their own, doctors & admins see all
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'patient') {
      filter.patientEmail = req.user.email;
    }
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/appointments
router.post(
  '/',
  [
    body('doctor').notEmpty().withMessage('Doctor is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { doctor, date, time, reason } = req.body;

    try {
      const appointment = await Appointment.create({
        patientEmail: req.user.email,
        patientId: req.user._id,
        doctor,
        date,
        time,
        reason,
      });
      res.status(201).json({ appointment });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/appointments/:id/status – doctor or admin can update status
router.patch(
  '/:id/status',
  restrictTo('doctor', 'admin', 'hospital'),
  [body('status').isIn(['Scheduled', 'Confirmed', 'Completed', 'Cancelled'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status, notes: req.body.notes },
        { returnDocument: 'after' }
      );
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
      res.json({ appointment });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/appointments/:id – patient cancels their own
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const isOwner = appointment.patientEmail === req.user.email;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorised' });

    await appointment.deleteOne();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
