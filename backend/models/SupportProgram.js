const mongoose = require('mongoose');

const supportProgramSchema = new mongoose.Schema(
  {
    providerType: {
      type: String,
      enum: ['state', 'central', 'who'],
      required: true,
      default: 'central',
    },
    provider: { type: String, required: true, trim: true },
    badge: { type: String, trim: true },
    coverage: { type: Number, default: 0, min: 0, max: 100 },
    programName: { type: String, required: true, trim: true },
    support: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    accessSteps: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportProgram', supportProgramSchema);