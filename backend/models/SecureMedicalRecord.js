const mongoose = require('mongoose');

const secureMedicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, trim: true },
    encryptedPayload: { type: mongoose.Schema.Types.Mixed, required: true },
    payloadHash: { type: String, required: true, trim: true },
    ipfsHash: { type: String, trim: true },
    blockchainTxHash: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecureMedicalRecord', secureMedicalRecordSchema);