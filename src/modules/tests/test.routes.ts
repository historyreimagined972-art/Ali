import { Router } from 'express';
import { testController } from './test.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { generateTestSchema, submitAttemptSchema } from './test.schema.js';

const router = Router();

// All routes require auth
router.use(requireAuth);

// Test routes
router.get('/', testController.getTests);
router.get('/:id', testController.getTestById);
router.get('/:id/pdf', testController.downloadTestPDF);
router.post('/generate', roleGuard('admin', 'student'), validate(generateTestSchema), testController.generateTest);

// Attempt routes
router.post('/attempts/start', testController.startAttempt);
router.post('/attempts/submit', validate(submitAttemptSchema), testController.submitAttempt);
router.post('/attempts/grade', testController.gradeAttempt);
router.get('/attempts/:id', testController.getAttempt);
router.get('/attempts', testController.getMyAttempts);

export default router;
