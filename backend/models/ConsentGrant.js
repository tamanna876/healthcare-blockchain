const mongoose = require('mongoose');

const consentGrantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    granteeType: {
      type: String,
      enum: ['doctor', 'family'],
      required: true,
    },
    granteeName: {
      type: String,
      required: true,
      trim: true,
    },
    granteeIdentifier: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    permissions: {
      type: [String],
      default: ['view-records'],
    },
    contexts: {
      type: [String],
      enum: ['normal', 'emergency'],
      default: ['normal'],
    },
    breakGlassAllowed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired'],
      default: 'active',
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    autoRevokeAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

consentGrantSchema.index({ ownerEmail: 1, status: 1, expiresAt: 1 });

module.exports = mongoose.model('ConsentGrant', consentGrantSchema);
