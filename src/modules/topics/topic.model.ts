import mongoose, { Document, Schema } from 'mongoose';
import { ISubject } from '../subjects/subject.model.js';

export interface ITopic extends Document {
  name: string;
  subject: ISubject['_id'];
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
      maxlength: [200, 'Topic name cannot exceed 200 characters'],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique topic name per subject
topicSchema.index({ name: 1, subject: 1 }, { unique: true });

export const Topic = mongoose.model<ITopic>('Topic', topicSchema);
