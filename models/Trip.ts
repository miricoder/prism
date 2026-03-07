import mongoose from 'mongoose';

// Dynamic field schema for flexible data
const DynamicFieldSchema = new mongoose.Schema(
  {
    key: String,
    value: mongoose.Schema.Types.Mixed,
    type: { type: String, enum: ['text', 'number', 'date', 'currency', 'boolean', 'url'] },
  },
  { _id: false }
);

// Entry schema for hotels, flights, activities, etc.
const EntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['flight', 'hotel', 'activity', 'transport', 'meal', 'other'], default: 'other' },
    title: String,
    description: String,
    startDate: Date,
    endDate: Date,
    cost: Number,
    currency: { type: String, default: 'USD' },
    location: String,
    fields: [DynamicFieldSchema],
    notes: String,
  },
  { timestamps: true }
);

// Main Trip schema
const TripSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    destination: String,
    startDate: Date,
    endDate: Date,
    reason: String,
    description: String,
    budget: {
      total: Number,
      currency: { type: String, default: 'USD' },
      spent: { type: Number, default: 0 },
    },
    entries: [EntrySchema],
    fields: [DynamicFieldSchema], // Trip-level custom fields
    fieldSchema: {
      type: Map,
      of: String, // Maps field name to data type
      default: new Map(),
    },
    status: {
      type: String,
      enum: ['planning', 'in-progress', 'completed', 'archived'],
      default: 'planning',
    },
    tags: [String],
    metadata: {
      importedFrom: String,
      importedAt: Date,
      lastModifiedField: String,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
TripSchema.index({ userId: 1, createdAt: -1 });
TripSchema.index({ userId: 1, destination: 1 });
TripSchema.index({ userId: 1, startDate: 1 });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
