const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    patientEmail: { type: String, required: true, trim: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedByDoctor: { type: String, trim: true },
    medication: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, trim: true },
    durationDays: { type: Number },
    pharmacy: { type: String, trim: true },
    refillsAllowed: { type: Number, default: 0 },
    refillsUsed: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Requested', 'Fulfilled', 'Expired', 'Cancelled'],
      default: 'Active',
    },
    doctorSignature: { type: String, trim: true },
    signatureIssuedAt: { type: Date, default: null },
    dispenseLogHash: { type: String, trim: true },
    lastDispensedAt: { type: Date, default: null },
    refillBlocked: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
