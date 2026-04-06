import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { invalidateAllSessions, getUserActiveSessions } from '@/lib/session-manager';

/**
 * GET /api/session/sessions - Get all active sessions for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await getUserActiveSessions(session.user.email);

    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    console.error('GET /api/session/sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/session/logout-all - Logout from all devices
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logoutAll } = body;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (logoutAll) {
      const count = await invalidateAllSessions(session.user.email);
      return NextResponse.json({
        success: true,
        message: `Logged out from ${count} device(s)`,
        count,
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/session/logout-all error:', error);
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
