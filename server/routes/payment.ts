import express from 'express';
import { processPayment, getMyPayments, getCampaignPayments } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, processPayment);
router.get('/my-payments', authenticate, getMyPayments);
router.get('/campaign/:campaignId', authenticate, getCampaignPayments);

export default router;
