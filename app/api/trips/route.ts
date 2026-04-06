import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Trip from '@/models/Trip';

// GET - List trips for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const trips = await Trip.find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      data: trips,
      count: trips.length,
    });
  } catch (error: any) {
    console.error('GET /api/trips error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

// POST - Create new trip
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    const trip = new Trip({
      userId: session.user.email,
      name: body.name,
      destination: body.destination,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      reason: body.reason,
      description: body.description,
      budget: body.budget,
      entries: body.entries || [],
      fields: body.fields || [],
      status: body.status || 'planning',
      tags: body.tags || [],
      isLocked: body.isLocked ?? false,
    });

    await trip.save();

    return NextResponse.json({
      success: true,
      data: trip,
      message: 'Trip created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/trips error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create trip' },
      { status: 500 }
    );
  }
}
