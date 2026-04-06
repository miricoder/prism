import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import { getDeviceInfo, getClientIp } from '@/lib/device-detection';

/**
 * POST /api/session/check-conflict
 * Check if user is trying to log in from a different device/browser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await connectDB();

    const deviceInfo = getDeviceInfo(request.headers);
    const ipAddress = getClientIp(request.headers);

    // Get latest active session for this user on same device type
    const existingSession = await Session.findOne({
      userId,
      deviceType: deviceInfo.deviceType,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActivityAt: -1 });

    if (existingSession) {
      // Check if it's a different browser/device
      const isSameDevice =
        existingSession.deviceInfo.fingerprint === deviceInfo.fingerprint &&
        existingSession.ipAddress === ipAddress;

      if (!isSameDevice) {
        return NextResponse.json({
          success: true,
          conflict: true,
          message:
            'You are already logged in from another browser/device. Logging in here will sign you out there.',
          existingSession: {
            browser: existingSession.deviceInfo.browser,
            os: existingSession.deviceInfo.os,
            createdAt: existingSession.createdAt,
          },
          newDevice: {
            browser: deviceInfo.browser,
            os: deviceInfo.os,
          },
        });
      }
    }

    // No conflict - can proceed with login
    return NextResponse.json({
      success: true,
      conflict: false,
      message: 'No conflict detected',
    });
  } catch (error: any) {
    console.error('POST /api/session/check-conflict error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check session conflict' },
      { status: 500 }
    );
  }
}
