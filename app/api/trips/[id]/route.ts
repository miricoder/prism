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

    const trip = await Trip.findOneAndUpdate(
      { _id: params.id, userId: session.user.email },
      {
        name: body.name,
        destination: body.destination,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        reason: body.reason,
        description: body.description,
        budget: body.budget,
        entries: body.entries,
        fields: body.fields,
        status: body.status,
        tags: body.tags,
      },
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

    const trip = await Trip.findOneAndDelete({
      _id: params.id,
      userId: session.user.email,
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

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
