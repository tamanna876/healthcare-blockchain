const mongoose = require('mongoose');

const clinicalTrialSchema = new mongoose.Schema(
  {
    trialName: { type: String, required: true, trim: true },
    trialId: { type: String, required: true, unique: true },
    researcher: { type: String, required: true, trim: true },
    institution: { type: String, trim: true },
    phase: {
      type: String,
      enum: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Observational'],
      default: 'Phase 1',
    },
    status: {
      type: String,
      enum: ['Recruiting', 'Active', 'Completed', 'Suspended', 'Terminated'],
      default: 'Recruiting',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    participantCount: { type: Number, default: 0 },
    description: { type: String, trim: true },
    resultData: { type: String, trim: true },
    eligibilityCriteria: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicalTrial', clinicalTrialSchema);
