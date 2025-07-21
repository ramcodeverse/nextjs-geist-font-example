import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmark extends Document {
  user: mongoose.Types.ObjectId;
  campaign: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign is required']
  }
}, {
  timestamps: true
});

// Ensure a user can only bookmark a campaign once
BookmarkSchema.index({ user: 1, campaign: 1 }, { unique: true });

// Index for efficient queries
BookmarkSchema.index({ user: 1, createdAt: -1 });
BookmarkSchema.index({ campaign: 1 });

export default mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
