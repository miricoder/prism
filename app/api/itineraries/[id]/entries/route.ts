import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Itinerary from '@/models/Itinerary';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid itinerary ID' }, { status: 400 });
    }

    const body = await request.json();
    const entry = body.entry;
    if (!entry || !entry.title) {
      return NextResponse.json({ error: 'Entry title is required' }, { status: 400 });
    }

    await connectDB();

    const itinerary = await Itinerary.findOne({
      _id: params.id,
      userId: session.user.email,
    });

    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    if (itinerary.isLocked) {
      return NextResponse.json({ error: 'Itinerary is locked' }, { status: 423 });
    }

    itinerary.entries = [...(itinerary.entries || []), entry];

    if (entry.startDate && (!itinerary.startDate || new Date(entry.startDate) < itinerary.startDate)) {
      itinerary.startDate = new Date(entry.startDate);
    }
    if (entry.endDate && (!itinerary.endDate || new Date(entry.endDate) > itinerary.endDate)) {
      itinerary.endDate = new Date(entry.endDate);
    }

    await itinerary.save();

    return NextResponse.json({
      success: true,
      data: itinerary,
      message: 'Entry added successfully',
    });
  } catch (error: any) {
    console.error(`POST /api/itineraries/${params.id}/entries error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to add entry' },
      { status: 500 }
    );
  }
}
