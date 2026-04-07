const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'pharmacy', 'hospital', 'admin'],
      default: 'patient',
    },
    displayName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    authProviders: {
      type: [String],
      default: ['email'],
    },
    providerId: {
      type: String,
      trim: true,
      sparse: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    healthId: {
      type: String,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    walletNonce: {
      type: String,
      select: false,
    },
    walletLastLoginAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
      bloodDonationAlerts: { type: Boolean, default: true },
      organDonationAlerts: { type: Boolean, default: true },
      emergencyAlerts: { type: Boolean, default: true },
      certificateAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Hash password before saving.
// Mongoose v9 async middleware should not call `next()` explicitly.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Generate healthId before first save.
userSchema.pre('save', function () {
  if (!this.healthId) {
    const suffix = Buffer.from(this.email).toString('base64').slice(0, 10);
    this.healthId = `HC-${suffix}`;
  }
  if (!this.displayName) {
    this.displayName = this.email.split('@')[0];
  }
  if (!Array.isArray(this.authProviders) || this.authProviders.length === 0) {
    this.authProviders = ['email'];
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
