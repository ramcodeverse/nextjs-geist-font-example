import mongoose, { Document, Schema } from 'mongoose';

export interface IRewardTier {
  title: string;
  description: string;
  amount: number;
  estimatedDelivery: Date;
  backerCount: number;
  isLimited: boolean;
  limitCount?: number;
}

export interface ICampaign extends Document {
  title: string;
  description: string;
  goal: number;
  currentAmount: number;
  imageUrl: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  creator: mongoose.Types.ObjectId;
  rewardTiers: IRewardTier[];
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  location?: string;
  videoUrl?: string;
  backerCount: number;
  progressPercentage: number;
}

const RewardTierSchema = new Schema<IRewardTier>({
  title: {
    type: String,
    required: [true, 'Reward title is required'],
    trim: true,
    maxlength: [100, 'Reward title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Reward description is required'],
    maxlength: [500, 'Reward description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Reward amount is required'],
    min: [1, 'Reward amount must be at least $1']
  },
  estimatedDelivery: {
    type: Date,
    required: [true, 'Estimated delivery date is required']
  },
  backerCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isLimited: {
    type: Boolean,
    default: false
  },
  limitCount: {
    type: Number,
    min: 1
  }
});

const CampaignSchema = new Schema<ICampaign>({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
    maxlength: [100, 'Campaign title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required'],
    maxlength: [5000, 'Campaign description cannot exceed 5000 characters']
  },
  goal: {
    type: Number,
    required: [true, 'Campaign goal is required'],
    min: [100, 'Campaign goal must be at least $100']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  imageUrl: {
    type: String,
    required: [true, 'Campaign image is required']
  },
  category: {
    type: String,
    required: [true, 'Campaign category is required'],
    enum: ['technology', 'art', 'music', 'film', 'games', 'design', 'food', 'fashion', 'publishing', 'other']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rewardTiers: [RewardTierSchema],
  endDate: {
    type: Date,
    required: [true, 'Campaign end date is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'End date must be in the future'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  videoUrl: {
    type: String,
    trim: true
  },
  backerCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Virtual for progress percentage
CampaignSchema.virtual('progressPercentage').get(function() {
  return Math.min(Math.round((this.currentAmount / this.goal) * 100), 100);
});

// Ensure virtual fields are serialized
CampaignSchema.set('toJSON', { virtuals: true });
CampaignSchema.set('toObject', { virtuals: true });

// Index for search functionality
CampaignSchema.index({ title: 'text', description: 'text', tags: 'text' });
CampaignSchema.index({ category: 1, status: 1 });
CampaignSchema.index({ creator: 1 });
CampaignSchema.index({ createdAt: -1 });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
