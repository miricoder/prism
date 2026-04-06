import mongoose from 'mongoose';

const DynamicFieldSchema = new mongoose.Schema(
  {
    key: String,
    value: mongoose.Schema.Types.Mixed,
    type: { type: String, enum: ['text', 'number', 'date', 'currency', 'boolean', 'url'] },
  },
  { _id: false }
);

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
    isChecked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const PlannedActivitySchema = new mongoose.Schema(
  {
    title: String,
    type: {
      type: String,
      enum: ['event', 'shopping', 'breakfast', 'lunch', 'dinner', 'tour', 'other'],
      default: 'other',
    },
    cost: Number,
    currency: { type: String, default: 'USD' },
  },
  { _id: false }
);

const ItinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    correlationId: {
      type: String,
      index: true,
    },
    legacyTripId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    destination: String,
    citiesCountries: [String],
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
    plannedActivities: [PlannedActivitySchema],
    fields: [DynamicFieldSchema],
    fieldSchema: {
      type: Map,
      of: String,
      default: new Map(),
    },
    status: {
      type: String,
      enum: ['planning', 'locked-in', 'in-progress', 'completed', 'archived'],
      default: 'planning',
    },
    tags: [String],
    metadata: {
      importedFrom: String,
      importedAt: Date,
      lastModifiedField: String,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ItinerarySchema.index({ userId: 1, createdAt: -1 });
ItinerarySchema.index({ userId: 1, destination: 1 });
ItinerarySchema.index({ userId: 1, startDate: 1 });
ItinerarySchema.index({ userId: 1, correlationId: 1 });

export default mongoose.models.Itinerary || mongoose.model('Itinerary', ItinerarySchema);
