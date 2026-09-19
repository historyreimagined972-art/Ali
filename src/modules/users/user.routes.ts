import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { User } from './user.model.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

// All routes require auth and admin role
router.use(requireAuth);
router.use(roleGuard('admin'));

// Get all users
router.get('/', async (_req, res, next) => {
  try {
    const users = await User.find().select('-refreshTokens');
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-refreshTokens');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Update user role
router.patch('/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'student'].includes(role)) {
      throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-refreshTokens');

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: { message: 'User deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
