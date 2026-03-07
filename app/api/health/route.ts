import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      nextauth_secret: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      database_url: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      encryption_key: process.env.ENCRYPTION_KEY ? 'SET' : 'MISSING',
      nextauth_url: process.env.NEXTAUTH_URL || 'NOT SET',
      node_env: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
