const mongoose = require('mongoose');

const savedFilterViewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      enum: ['records', 'donors', 'trials', 'notifications'],
      default: 'records',
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    role: {
      type: String,
      trim: true,
      default: 'all',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedFilterView', savedFilterViewSchema);
