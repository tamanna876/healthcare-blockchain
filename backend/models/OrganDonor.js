const mongoose = require('mongoose');

const organDonorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organType: {
      type: String,
      required: true,
      enum: ['Kidney', 'Liver', 'Heart', 'Lungs', 'Cornea', 'Pancreas', 'Intestine', 'Bone Marrow'],
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    location: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    txHash: { type: String }, // blockchain transaction hash
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrganDonor', organDonorSchema);
