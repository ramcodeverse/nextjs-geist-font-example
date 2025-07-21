import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  campaign: mongoose.Types.ObjectId;
  backer: mongoose.Types.ObjectId;
  amount: number;
  rewardTier?: mongoose.Types.ObjectId;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  transactionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

const PaymentSchema = new Schema<IPayment>({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign is required']
  },
  backer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Backer is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [1, 'Payment amount must be at least $1']
  },
  rewardTier: {
    type: Schema.Types.ObjectId,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer'],
    default: 'stripe'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
PaymentSchema.index({ campaign: 1, backer: 1 });
PaymentSchema.index({ backer: 1, createdAt: -1 });
PaymentSchema.index({ campaign: 1, status: 1 });
PaymentSchema.index({ transactionId: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
