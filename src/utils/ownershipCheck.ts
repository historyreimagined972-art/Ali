import { Model, Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';

export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  userId: string
): Promise<T> {
  const doc = await ModelClass.findOne({
    _id: new Types.ObjectId(resourceId),
    userId: new Types.ObjectId(userId),
  } as any);

  if (!doc) {
    throw new AppError('Resource not found', 404, 'NOT_FOUND');
  }

  return doc;
}
