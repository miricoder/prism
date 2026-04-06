import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';

/**
 * POST /api/session/validate
 * Validate session token is active
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    if (!token) {
      return NextResponse.json({ active: false }, { status: 200 });
    }
    await connectDB();
    const session = await Session.findOne({ token, isActive: true, expiresAt: { $gt: new Date() } });
    return NextResponse.json({ active: !!session });
  } catch (error: any) {
    console.error('POST /api/session/validate error:', error);
    return NextResponse.json({ active: false, error: error.message || 'Failed to validate session' }, { status: 500 });
  }
}
