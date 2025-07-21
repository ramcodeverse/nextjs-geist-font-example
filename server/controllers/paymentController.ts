import { Response } from 'express';
import Payment from '../models/Payment';
import Campaign from '../models/Campaign';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

// Simulate payment processing
export const processPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { campaignId, amount, rewardTierId } = req.body;

  if (!campaignId || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Campaign ID and amount are required'
    });
  }

  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  if (campaign.status !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Campaign is not approved for funding'
    });
  }

  if (new Date() > campaign.endDate) {
    return res.status(400).json({
      success: false,
      message: 'Campaign has ended'
    });
  }

  // Create payment record
  const payment = await Payment.create({
    campaign: campaignId,
    backer: req.user.id,
    amount,
    rewardTier: rewardTierId || null,
    status: 'completed',
    paymentMethod: 'stripe',
    transactionId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });

  // Update campaign funding
  campaign.currentAmount += amount;
  campaign.backerCount += 1;
  await campaign.save();

  res.status(201).json({
    success: true,
    message: 'Payment processed successfully',
    data: { payment, campaign }
  });
});

// Get user's payments
export const getMyPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payments = await Payment.find({ backer: req.user.id })
    .populate({
      path: 'campaign',
      select: 'title imageUrl creator',
      populate: {
        path: 'creator',
        select: 'username'
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { payments }
  });
});

// Get campaign payments
export const getCampaignPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { campaignId } = req.params;

  const payments = await Payment.find({ campaign: campaignId })
    .populate('backer', 'username avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { payments }
  });
});
