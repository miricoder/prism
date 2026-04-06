import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Itinerary from '@/models/Itinerary';
import { parseImport } from '@/lib/data-parser';
import { randomUUID } from 'crypto';

async function resolveItinerary(userId: string, itineraryName?: string) {
  if (!itineraryName) return null;
  return Itinerary.findOne({ userId, name: itineraryName });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, format, itineraryName } = body;

    if (!content || !format) {
      return NextResponse.json({ error: 'Missing content or format' }, { status: 400 });
    }

    if (!['csv', 'json', 'text'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Must be csv, json, or text' }, { status: 400 });
    }

    const parsed = parseImport(content, format as 'csv' | 'json' | 'text', session.user.email, itineraryName);

    await connectDB();

    let itinerary = await resolveItinerary(session.user.email, itineraryName || parsed.name);
    if (!itinerary) {
      itinerary = new Itinerary({
        userId: session.user.email,
        correlationId: randomUUID(),
        name: itineraryName || parsed.name,
        destination: parsed.destination,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        reason: parsed.reason,
        description: parsed.description,
        budget: parsed.budget,
        entries: parsed.entries,
        fields: parsed.fields,
        fieldSchema: parsed.fieldSchema,
        status: 'planning',
        metadata: {
          importedFrom: format,
          importedAt: new Date(),
        },
      });
      await itinerary.save();
    } else {
      if (itinerary.isLocked) {
        return NextResponse.json({ error: 'Itinerary is locked' }, { status: 423 });
      }
      itinerary.entries = [...(itinerary.entries || []), ...parsed.entries];
      itinerary.fields = [...(itinerary.fields || []), ...(parsed.fields || [])];
      if (parsed.destination) itinerary.destination = parsed.destination;
      if (parsed.startDate && (!itinerary.startDate || parsed.startDate < itinerary.startDate)) {
        itinerary.startDate = parsed.startDate;
      }
      if (parsed.endDate && (!itinerary.endDate || parsed.endDate > itinerary.endDate)) {
        itinerary.endDate = parsed.endDate;
      }
      await itinerary.save();
    }

    return NextResponse.json({
      success: true,
      data: itinerary,
      message: `Itinerary updated successfully from ${format.toUpperCase()}`,
      stats: {
        entriesCount: parsed.entries.length,
        fieldsCount: parsed.fieldSchema.size,
      },
    });
  } catch (error: any) {
    console.error('POST /api/itineraries/import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import itinerary' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, format, itineraryName } = body;

    if (!content || !format) {
      return NextResponse.json({ error: 'Missing content or format' }, { status: 400 });
    }

    const parsed = parseImport(content, format as 'csv' | 'json' | 'text', session.user.email, itineraryName);

    return NextResponse.json({
      success: true,
      preview: {
        name: itineraryName || parsed.name,
        destination: parsed.destination,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        entriesCount: parsed.entries.length,
        entries: parsed.entries.slice(0, 5),
        fieldsCount: parsed.fieldSchema.size,
        fields: Array.from(parsed.fieldSchema.entries()).map(([key, type]) => ({
          key,
          type,
        })),
      },
      message: 'Preview generated successfully',
    });
  } catch (error: any) {
    console.error('PUT /api/itineraries/import (preview) error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview import' },
      { status: 400 }
    );
  }
}
