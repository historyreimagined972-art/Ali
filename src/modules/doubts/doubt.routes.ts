import { Router } from 'express';
import { doubtController } from './doubt.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { askDoubtSchema } from './doubt.schema.js';

const router = Router();

// All routes require auth
router.use(requireAuth);

// Ask a doubt
router.post('/ask', validate(askDoubtSchema), doubtController.askDoubt);

export default router;
