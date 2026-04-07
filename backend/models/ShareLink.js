const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    patientAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    purpose: {
      type: String,
      default: 'record-share',
      trim: true,
    },
    watermarkText: {
      type: String,
      default: 'Shared via Healthcare Vault',
      trim: true,
    },
    allowDownload: {
      type: Boolean,
      default: false,
    },
    oneTime: {
      type: Boolean,
      default: true,
    },
    maxViews: {
      type: Number,
      default: 1,
    },
    views: {
      type: Number,
      default: 0,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShareLink', shareLinkSchema);
