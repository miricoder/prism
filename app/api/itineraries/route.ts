import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Itinerary from '@/models/Itinerary';
import Trip from '@/models/Trip';
import { randomUUID } from 'crypto';

async function migrateLegacyTrips(userId: string) {
  const existingItineraries = await Itinerary.countDocuments({ userId });
  if (existingItineraries > 0) return;

  const legacyTrips = await Trip.find({ userId }).lean();
  if (legacyTrips.length === 0) return;

  const docs = legacyTrips.map((trip: any) => ({
    userId,
    correlationId: randomUUID(),
    legacyTripId: trip._id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    reason: trip.reason,
    description: trip.description,
    budget: trip.budget,
    entries: trip.entries || [],
    fields: trip.fields || [],
    fieldSchema: trip.fieldSchema || new Map(),
    status: trip.status || 'planning',
    tags: trip.tags || [],
    metadata: trip.metadata,
    isLocked: trip.isLocked ?? false,
  }));

  if (docs.length > 0) {
    await Itinerary.insertMany(docs);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await migrateLegacyTrips(session.user.email);

    const itineraries = await Itinerary.find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      data: itineraries,
      count: itineraries.length,
    });
  } catch (error: any) {
    console.error('GET /api/itineraries error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    const existing = await Itinerary.findOne({
      userId: session.user.email,
      name: body.name,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Itinerary name already exists' },
        { status: 409 }
      );
    }

    const itinerary = new Itinerary({
      userId: session.user.email,
      correlationId: body.correlationId || randomUUID(),
      name: body.name,
      destination: body.destination,
      citiesCountries: body.citiesCountries || [],
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      reason: body.reason,
      description: body.description,
      budget: body.budget,
      entries: body.entries || [],
      plannedActivities: body.plannedActivities || [],
      fields: body.fields || [],
      status: body.status || 'planning',
      tags: body.tags || [],
      isLocked: body.isLocked ?? false,
    });

    await itinerary.save();

    return NextResponse.json({
      success: true,
      data: itinerary,
      message: 'Itinerary created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/itineraries error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create itinerary' },
      { status: 500 }
    );
  }
}
