import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Itinerary from '@/models/Itinerary';
import mongoose from 'mongoose';

export async function GET(
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

    await connectDB();

    const itinerary = await Itinerary.findOne({
      _id: params.id,
      userId: session.user.email,
    });

    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: itinerary });
  } catch (error: any) {
    console.error(`GET /api/itineraries/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch itinerary' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    await connectDB();

    const existing = await Itinerary.findOne({ _id: params.id, userId: session.user.email });
    if (!existing) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const prevStatus = existing.status;

    if (Object.prototype.hasOwnProperty.call(body, 'name')) existing.name = body.name;
    if (Object.prototype.hasOwnProperty.call(body, 'destination')) existing.destination = body.destination;
    if (Object.prototype.hasOwnProperty.call(body, 'startDate')) {
      existing.startDate = body.startDate ? new Date(body.startDate) : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'endDate')) {
      existing.endDate = body.endDate ? new Date(body.endDate) : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'reason')) existing.reason = body.reason;
    if (Object.prototype.hasOwnProperty.call(body, 'description')) existing.description = body.description;
    if (Object.prototype.hasOwnProperty.call(body, 'budget')) existing.budget = body.budget;
    if (Object.prototype.hasOwnProperty.call(body, 'entries')) existing.entries = body.entries;
    if (Object.prototype.hasOwnProperty.call(body, 'fields')) existing.fields = body.fields;
    if (Object.prototype.hasOwnProperty.call(body, 'status')) existing.status = body.status;
    if (Object.prototype.hasOwnProperty.call(body, 'tags')) existing.tags = body.tags;
    if (Object.prototype.hasOwnProperty.call(body, 'isLocked')) existing.isLocked = body.isLocked;

    // If status moved to 'locked-in' or 'archived' from something else, create an immutable snapshot
    let createdSnapshot = null;
    if ((existing.status === 'locked-in' || existing.status === 'archived') && prevStatus !== existing.status) {
      try {
        const ItinerarySnapshot = (await import('@/models/ItinerarySnapshot')).default;
        const snapshotDoc = new ItinerarySnapshot({
          itineraryId: existing._id,
          userId: session.user.email,
          snapshot: existing.toObject(),
          note: 'Locked in snapshot',
        });
        createdSnapshot = await snapshotDoc.save();
      } catch (snapErr) {
        console.error('Failed to create itinerary snapshot:', snapErr);
      }
    }

    const saved = await existing.save();

    return NextResponse.json({
      success: true,
      data: saved,
      snapshot: createdSnapshot || null,
      message: 'Itinerary updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/itineraries/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update itinerary' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await connectDB();

    const existing = await Itinerary.findOne({
      _id: params.id,
      userId: session.user.email,
    });

    if (!existing) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    if (existing.isLocked) {
      return NextResponse.json({ error: 'Itinerary is locked' }, { status: 423 });
    }

    await Itinerary.deleteOne({ _id: params.id, userId: session.user.email });

    return NextResponse.json({
      success: true,
      message: 'Itinerary deleted successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/itineraries/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete itinerary' },
      { status: 500 }
    );
  }
}
