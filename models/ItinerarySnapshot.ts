import mongoose from 'mongoose';

const ItinerarySnapshotSchema = new mongoose.Schema(
  {
    itineraryId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: String, required: true, index: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    note: { type: String },
    archivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ItinerarySnapshotSchema.index({ userId: 1, archivedAt: -1 });

export default mongoose.models.ItinerarySnapshot || mongoose.model('ItinerarySnapshot', ItinerarySnapshotSchema);
