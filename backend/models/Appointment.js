const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientEmail: { type: String, required: true, trim: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctor: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
