import { Response } from 'express';
import Campaign from '../models/Campaign';
import Payment from '../models/Payment';
import Bookmark from '../models/Bookmark';
import QandA from '../models/QandA';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

// Create campaign
export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    goal,
    imageUrl,
    category,
    rewardTiers,
    endDate,
    tags,
    location,
    videoUrl
  } = req.body;

  // Validation
  if (!title || !description || !goal || !imageUrl || !category || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  const campaign = await Campaign.create({
    title,
    description,
    goal,
    imageUrl,
    category,
    rewardTiers: rewardTiers || [],
    endDate,
    tags: tags || [],
    location,
    videoUrl,
    creator: req.user.id
  });

  await campaign.populate('creator', 'username email avatar');

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: { campaign }
  });
});

// Get all campaigns
export const getCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 12,
    category,
    status = 'approved',
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by category
  if (category && category !== 'all') {
    query.category = category;
  }

  // Search functionality
  if (search) {
    query.$text = { $search: search as string };
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const campaigns = await Campaign.find(query)
    .populate('creator', 'username email avatar')
    .sort(sortOptions)
    .limit(Number(limit) * Number(page))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Campaign.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});

// Get single campaign
export const getCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findById(id)
    .populate('creator', 'username email avatar bio');

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Get campaign comments/Q&A
  const qanda = await QandA.find({ campaign: id })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 });

  // Check if user has bookmarked this campaign
  let isBookmarked = false;
  if (req.user) {
    const bookmark = await Bookmark.findOne({
      user: req.user.id,
      campaign: id
    });
    isBookmarked = !!bookmark;
  }

  res.status(200).json({
    success: true,
    data: {
      campaign,
      qanda,
      isBookmarked
    }
  });
});

// Update campaign
export const updateCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findById(id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Check if user is the creator or admin
  if (campaign.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this campaign'
    });
  }

  // Only allow updates if campaign is pending or if user is admin
  if (campaign.status !== 'pending' && req.user.role !== 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update approved campaigns'
    });
  }

  const updatedCampaign = await Campaign.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  ).populate('creator', 'username email avatar');

  res.status(200).json({
    success: true,
    message: 'Campaign updated successfully',
    data: { campaign: updatedCampaign }
  });
});

// Delete campaign
export const deleteCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findById(id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Check if user is the creator or admin
  if (campaign.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this campaign'
    });
  }

  // Don't allow deletion if campaign has received funding
  if (campaign.currentAmount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete campaign that has received funding'
    });
  }

  await Campaign.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Campaign deleted successfully'
  });
});

// Approve/Reject campaign (Admin only)
export const updateCampaignStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be approved or rejected'
    });
  }

  const campaign = await Campaign.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate('creator', 'username email avatar');

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  res.status(200).json({
    success: true,
    message: `Campaign ${status} successfully`,
    data: { campaign }
  });
});

// Bookmark campaign
export const bookmarkCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findById(id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Check if already bookmarked
  const existingBookmark = await Bookmark.findOne({
    user: req.user.id,
    campaign: id
  });

  if (existingBookmark) {
    // Remove bookmark
    await Bookmark.findByIdAndDelete(existingBookmark._id);
    return res.status(200).json({
      success: true,
      message: 'Campaign removed from bookmarks',
      data: { isBookmarked: false }
    });
  } else {
    // Add bookmark
    await Bookmark.create({
      user: req.user.id,
      campaign: id
    });
    return res.status(200).json({
      success: true,
      message: 'Campaign bookmarked successfully',
      data: { isBookmarked: true }
    });
  }
});

// Get user's bookmarked campaigns
export const getBookmarkedCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bookmarks = await Bookmark.find({ user: req.user.id })
    .populate({
      path: 'campaign',
      populate: {
        path: 'creator',
        select: 'username email avatar'
      }
    })
    .sort({ createdAt: -1 });

  const campaigns = bookmarks.map(bookmark => bookmark.campaign);

  res.status(200).json({
    success: true,
    data: { campaigns }
  });
});

// Add comment/question to campaign
export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content, type = 'comment', parentId } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Content is required'
    });
  }

  const campaign = await Campaign.findById(id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Check if this is a creator response
  const isCreatorResponse = campaign.creator.toString() === req.user.id;

  const comment = await QandA.create({
    campaign: id,
    user: req.user.id,
    content,
    type,
    parentId: parentId || null,
    isCreatorResponse
  });

  await comment.populate('user', 'username avatar');

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment }
  });
});

// Get user's campaigns
export const getMyCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const campaigns = await Campaign.find({ creator: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { campaigns }
  });
});
