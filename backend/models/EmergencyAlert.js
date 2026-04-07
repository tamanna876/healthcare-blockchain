const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: ['blood', 'organ', 'general'],
      default: 'general',
    },
    location: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },
    status: {
      type: String,
      enum: ['open', 'seen', 'accepted', 'resolved', 'acknowledged', 'closed'],
      default: 'open',
    },
    seenAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    escalationLevel: {
      type: Number,
      default: 0,
    },
    escalationHistory: {
      type: [
        {
          toRole: { type: String, trim: true },
          at: { type: Date, default: Date.now },
          reason: { type: String, trim: true },
        },
      ],
      default: [],
    },
    workflowLog: {
      type: [
        {
          state: { type: String, trim: true },
          by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
          at: { type: Date, default: Date.now },
          note: { type: String, trim: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);