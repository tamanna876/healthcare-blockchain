const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    batchNumber: { type: String, required: true, trim: true },
    manufactureDate: { type: Date },
    expiryDate: { type: Date },
    compositionTags: [{ type: String, trim: true }],
    txHash: { type: String }, // blockchain verification hash
    isVerified: { type: Boolean, default: false },
    isRecalled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
