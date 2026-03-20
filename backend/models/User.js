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
    isActive: {
      type: Boolean,
      default: true,
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
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
