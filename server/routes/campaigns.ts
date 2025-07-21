import express from 'express';
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
  bookmarkCampaign,
  getBookmarkedCampaigns,
  addComment,
  getMyCampaigns
} from '../controllers/campaignController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getCampaigns);
router.get('/my-campaigns', authenticate, getMyCampaigns);
router.get('/bookmarked', authenticate, getBookmarkedCampaigns);
router.get('/:id', getCampaign);

// Protected routes
router.post('/', authenticate, authorize('creator', 'admin'), createCampaign);
router.put('/:id', authenticate, updateCampaign);
router.delete('/:id', authenticate, deleteCampaign);
router.post('/:id/bookmark', authenticate, bookmarkCampaign);
router.post('/:id/comments', authenticate, addComment);

// Admin routes
router.put('/:id/status', authenticate, authorize('admin'), updateCampaignStatus);

export default router;
