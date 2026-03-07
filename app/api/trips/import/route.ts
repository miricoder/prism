import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Trip from '@/models/Trip';
import { parseImport } from '@/lib/data-parser';

// POST - Import trip data from CSV, JSON, or text
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, format, tripName } = body;

    if (!content || !format) {
      return NextResponse.json(
        { error: 'Missing content or format' },
        { status: 400 }
      );
    }

    if (!['csv', 'json', 'text'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv, json, or text' },
        { status: 400 }
      );
    }

    // Parse the import data
    const parsed = parseImport(content, format as 'csv' | 'json' | 'text', session.user.email, tripName);

    await connectDB();

    // Create trip in database
    const trip = new Trip({
      userId: session.user.email,
      name: parsed.name,
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

    await trip.save();

    return NextResponse.json({
      success: true,
      data: trip,
      message: `Trip imported successfully from ${format.toUpperCase()}`,
      stats: {
        entriesCount: parsed.entries.length,
        fieldsCount: parsed.fieldSchema.size,
      },
    });
  } catch (error: any) {
    console.error('POST /api/trips/import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import trip' },
      { status: 500 }
    );
  }
}

// POST - Preview import (validate without saving)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, format, tripName } = body;

    if (!content || !format) {
      return NextResponse.json(
        { error: 'Missing content or format' },
        { status: 400 }
      );
    }

    // Parse without saving
    const parsed = parseImport(content, format as 'csv' | 'json' | 'text', session.user.email, tripName);

    return NextResponse.json({
      success: true,
      preview: {
        name: parsed.name,
        destination: parsed.destination,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        entriesCount: parsed.entries.length,
        entries: parsed.entries.slice(0, 5), // First 5 entries as preview
        fieldsCount: parsed.fieldSchema.size,
        fields: Array.from(parsed.fieldSchema.entries()).map(([key, type]) => ({
          key,
          type,
        })),
      },
      message: 'Preview generated successfully',
    });
  } catch (error: any) {
    console.error('PUT /api/trips/import (preview) error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview import' },
      { status: 400 }
    );
  }
}
