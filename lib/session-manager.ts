/**
 * Session management service
 * Handles single-session-per-device-type logic
 */

import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import { DeviceInfo } from '@/lib/device-detection';

export interface SessionRecord {
  _id: string;
  userId: string;
  token: string;
  deviceType: 'mobile' | 'desktop';
  deviceInfo: {
    userAgent: string;
    browser: string;
    os: string;
    fingerprint: string;
  };
  ipAddress: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  lastActivityAt?: string;
}

/**
 * Create new session for user
 * Invalidates other sessions on same device type
 */
export async function createSession(
  userId: string,
  token: string,
  deviceInfo: DeviceInfo,
  ipAddress: string,
  expiryMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days
): Promise<SessionRecord> {
  try {
    await connectDB();

    // Invalidate all previous sessions for this user (regardless of device type)
    await Session.updateMany(
      {
        userId,
        isActive: true,
      },
      {
        isActive: false,
      }
    );

    // Create new session
    const session = new Session({
      userId,
      token,
      deviceType: deviceInfo.deviceType,
      deviceInfo,
      ipAddress,
      isActive: true,
      expiresAt: new Date(Date.now() + expiryMs),
      lastActivityAt: new Date(),
    });

    await session.save();

    return session.toObject() as SessionRecord;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Validate session exists and is active
 */
export async function validateSession(token: string): Promise<SessionRecord | null> {
  try {
    await connectDB();

    const session = await Session.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (session) {
      // Update last activity
      session.lastActivityAt = new Date();
      await session.save();
      return session.toObject() as SessionRecord;
    }

    return null;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Invalidate session
 */
export async function invalidateSession(token: string): Promise<boolean> {
  try {
    await connectDB();

    const result = await Session.updateOne(
      { token },
      { isActive: false }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
}

/**
 * Invalidate all sessions for user (logout all devices)
 */
export async function invalidateAllSessions(userId: string): Promise<number> {
  try {
    await connectDB();

    const result = await Session.updateMany(
      { userId },
      { isActive: false }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error('Error invalidating all sessions:', error);
    return 0;
  }
}

/**
 * Get active sessions for user
 */
export async function getUserActiveSessions(userId: string): Promise<SessionRecord[]> {
  try {
    await connectDB();

    const sessions = await Session.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActivityAt: -1 });

    return sessions.map((s) => s.toObject() as SessionRecord);
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

/**
 * Check if user has active session on different device type
 * Returns the session if one exists
 */
export async function getActiveSessionOnDeviceType(
  userId: string,
  deviceType: 'mobile' | 'desktop'
): Promise<SessionRecord | null> {
  try {
    await connectDB();

    const session = await Session.findOne({
      userId,
      deviceType,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActivityAt: -1 });

    return session ? (session.toObject() as SessionRecord) : null;
  } catch (error) {
    console.error('Error checking device session:', error);
    return null;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    await connectDB();

    const result = await Session.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { createdAt: { $lt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) } }, // 45 days
      ],
    });

    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
}
