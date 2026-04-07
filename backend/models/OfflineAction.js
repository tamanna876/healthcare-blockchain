const mongoose = require('mongoose');

const offlineActionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['queued', 'synced', 'failed'],
      default: 'queued',
      index: true,
    },
    syncedAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OfflineAction', offlineActionSchema);
