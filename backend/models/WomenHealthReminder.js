const mongoose = require('mongoose');

const womenHealthReminderSchema = new mongoose.Schema(
  {
    patientEmail: { type: String, required: true, trim: true, lowercase: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    language: { type: String, default: 'en', trim: true },
    stage: { type: String, required: true, trim: true },
    goal: { type: String, required: true, trim: true },
    reminderType: { type: String, required: true, trim: true },
    reminderDate: { type: Date, required: true },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WomenHealthReminder', womenHealthReminderSchema);