const mongoose = require('mongoose');

const bloodDonorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    location: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    donatedBefore: { type: Boolean, default: false },
    lastDonationDate: { type: Date },
    txHash: { type: String }, // blockchain transaction hash
    isAvailable: { type: Boolean, default: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodDonor', bloodDonorSchema);
