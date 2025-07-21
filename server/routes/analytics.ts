import express from 'express';
import Campaign from '../models/Campaign';
import Payment from '../models/Payment';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get funding trends for analytics
router.get('/funding-trends', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const payments = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const formattedData = payments.map(item => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day),
      amount: item.totalAmount,
      count: item.count
    }));

    res.status(200).json({
      success: true,
      data: { trends: formattedData }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

// Get dashboard stats
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'approved' });
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
    const totalFunding = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalBackers = await Payment.distinct('backer').countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalCampaigns,
        activeCampaigns,
        pendingCampaigns,
        totalFunding: totalFunding[0]?.total || 0,
        totalBackers
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

export default router;
