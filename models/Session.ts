import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop'],
      required: true,
    },
    deviceInfo: {
      userAgent: String,
      browser: String,
      os: String,
      fingerprint: String,
    },
    ipAddress: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000, // Auto-delete after 30 days
    },
    expiresAt: Date,
    lastActivityAt: Date,
  },
  { timestamps: true }
);

// Index for efficient queries
SessionSchema.index({ userId: 1, deviceType: 1, isActive: 1 });
SessionSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
