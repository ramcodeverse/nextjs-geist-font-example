import mongoose, { Document, Schema } from 'mongoose';

export interface IQandA extends Document {
  campaign: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: 'question' | 'comment';
  content: string;
  parentId?: mongoose.Types.ObjectId; // For replies
  isCreatorResponse: boolean;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
}

const QandASchema = new Schema<IQandA>({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign is required']
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    enum: ['question', 'comment'],
    default: 'comment'
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [1000, 'Content cannot exceed 1000 characters']
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'QandA',
    default: null
  },
  isCreatorResponse: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for efficient queries
QandASchema.index({ campaign: 1, createdAt: -1 });
QandASchema.index({ user: 1, createdAt: -1 });
QandASchema.index({ parentId: 1 });
QandASchema.index({ campaign: 1, type: 1 });

export default mongoose.model<IQandA>('QandA', QandASchema);
