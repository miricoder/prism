import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Trip from '@/models/Trip';
import mongoose from 'mongoose';

// GET - Fetch specific trip
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
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });
    }

    await connectDB();

    const trip = await Trip.findOne({
      _id: params.id,
      userId: session.user.email,
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error: any) {
    console.error(`GET /api/trips/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

// PUT - Update trip
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
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });
    }

    const body = await request.json();
    await connectDB();

    const updates: Record<string, any> = {};
    if (Object.prototype.hasOwnProperty.call(body, 'name')) updates.name = body.name;
    if (Object.prototype.hasOwnProperty.call(body, 'destination')) updates.destination = body.destination;
    if (Object.prototype.hasOwnProperty.call(body, 'startDate')) {
      updates.startDate = body.startDate ? new Date(body.startDate) : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'endDate')) {
      updates.endDate = body.endDate ? new Date(body.endDate) : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'reason')) updates.reason = body.reason;
    if (Object.prototype.hasOwnProperty.call(body, 'description')) updates.description = body.description;
    if (Object.prototype.hasOwnProperty.call(body, 'budget')) updates.budget = body.budget;
    if (Object.prototype.hasOwnProperty.call(body, 'entries')) updates.entries = body.entries;
    if (Object.prototype.hasOwnProperty.call(body, 'fields')) updates.fields = body.fields;
    if (Object.prototype.hasOwnProperty.call(body, 'status')) updates.status = body.status;
    if (Object.prototype.hasOwnProperty.call(body, 'tags')) updates.tags = body.tags;
    if (Object.prototype.hasOwnProperty.call(body, 'isLocked')) updates.isLocked = body.isLocked;

    const trip = await Trip.findOneAndUpdate(
      { _id: params.id, userId: session.user.email },
      updates,
      { new: true }
    );

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: trip,
      message: 'Trip updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/trips/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update trip' },
      { status: 500 }
    );
  }
}

// DELETE - Delete trip
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
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });
    }

    await connectDB();

    const existingTrip = await Trip.findOne({
      _id: params.id,
      userId: session.user.email,
    });

    if (!existingTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (existingTrip.isLocked) {
      return NextResponse.json({ error: 'Trip is locked' }, { status: 423 });
    }

    await Trip.deleteOne({ _id: params.id, userId: session.user.email });

    return NextResponse.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/trips/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
