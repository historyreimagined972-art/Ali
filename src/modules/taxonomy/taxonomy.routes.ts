import { Router } from 'express';
import { taxonomyController } from './taxonomy.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import {
  createBoardSchema,
  updateBoardSchema,
  createClassSchema,
  updateClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createTopicSchema,
  updateTopicSchema,
} from './taxonomy.schema.js';

const router = Router();

// All routes require auth
router.use(requireAuth);

// Board routes
router.get('/boards', taxonomyController.getBoards);
router.get('/boards/:id', taxonomyController.getBoardById);
router.post('/boards', roleGuard('admin'), validate(createBoardSchema), taxonomyController.createBoard);
router.patch('/boards/:id', roleGuard('admin'), validate(updateBoardSchema), taxonomyController.updateBoard);
router.delete('/boards/:id', roleGuard('admin'), taxonomyController.deleteBoard);

// Class routes
router.get('/classes', taxonomyController.getClasses);
router.get('/classes/:id', taxonomyController.getClassById);
router.post('/classes', roleGuard('admin'), validate(createClassSchema), taxonomyController.createClass);
router.patch('/classes/:id', roleGuard('admin'), validate(updateClassSchema), taxonomyController.updateClass);
router.delete('/classes/:id', roleGuard('admin'), taxonomyController.deleteClass);

// Subject routes
router.get('/subjects', taxonomyController.getSubjects);
router.get('/subjects/:id', taxonomyController.getSubjectById);
router.post('/subjects', roleGuard('admin'), validate(createSubjectSchema), taxonomyController.createSubject);
router.patch('/subjects/:id', roleGuard('admin'), validate(updateSubjectSchema), taxonomyController.updateSubject);
router.delete('/subjects/:id', roleGuard('admin'), taxonomyController.deleteSubject);

// Topic routes
router.get('/topics', taxonomyController.getTopics);
router.get('/topics/:id', taxonomyController.getTopicById);
router.post('/topics', roleGuard('admin'), validate(createTopicSchema), taxonomyController.createTopic);
router.patch('/topics/:id', roleGuard('admin'), validate(updateTopicSchema), taxonomyController.updateTopic);
router.delete('/topics/:id', roleGuard('admin'), taxonomyController.deleteTopic);

// Taxonomy tree
router.get('/tree', taxonomyController.getTaxonomyTree);

export default router;
