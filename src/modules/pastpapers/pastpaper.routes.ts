import { Router } from 'express';
import { pastPaperController } from './pastpaper.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { uploadPastPaperSchema, updatePastPaperSchema } from './pastpaper.schema.js';

const router = Router();

// All routes require auth
router.use(requireAuth);

// Past paper routes
router.get('/', pastPaperController.getPastPapers);
router.get('/:id', pastPaperController.getPastPaperById);
router.get('/:id/text', pastPaperController.getPastPaperText);
router.post('/', roleGuard('admin'), validate(uploadPastPaperSchema), pastPaperController.uploadPastPaper);
router.patch('/:id', roleGuard('admin'), validate(updatePastPaperSchema), pastPaperController.updatePastPaper);
router.delete('/:id', roleGuard('admin'), pastPaperController.deletePastPaper);

export default router;
