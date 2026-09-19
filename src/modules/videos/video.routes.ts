import { Router } from 'express';
import { videoController } from './video.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import {
  createChannelSchema,
  updateChannelSchema,
  createVideoSchema,
  updateVideoSchema,
} from './video.schema.js';

const router = Router();

// All routes require auth
router.use(requireAuth);

// Channel routes (admin only for create/update/delete)
router.get('/channels', videoController.getChannels);
router.get('/channels/:id', videoController.getChannelById);
router.post('/channels', roleGuard('admin'), validate(createChannelSchema), videoController.createChannel);
router.patch('/channels/:id', roleGuard('admin'), validate(updateChannelSchema), videoController.updateChannel);
router.delete('/channels/:id', roleGuard('admin'), videoController.deleteChannel);
router.patch('/channels/:id/approve', roleGuard('admin'), videoController.approveChannel);

// Video routes
router.get('/videos', videoController.getVideos);
router.get('/videos/:id', videoController.getVideoById);
router.get('/videos/:id/transcript', videoController.getVideoTranscript);
router.post('/videos', roleGuard('admin'), validate(createVideoSchema), videoController.createVideo);
router.patch('/videos/:id', roleGuard('admin'), validate(updateVideoSchema), videoController.updateVideo);
router.delete('/videos/:id', roleGuard('admin'), videoController.deleteVideo);
router.patch('/videos/:id/approve', roleGuard('admin'), videoController.approveVideo);

// Student endpoints
router.get('/student/videos/:topicId', videoController.getVideosForStudent);
router.get('/search', videoController.searchVideos);

// YouTube auto-fetch (admin only)
router.post('/resolve-url', roleGuard('admin'), videoController.resolveUrl);
router.post('/fetch-videos', roleGuard('admin'), videoController.fetchVideos);

export default router;
