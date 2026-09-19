import mongoose, { Document, Schema } from 'mongoose';
import { IClass } from '../classes/class.model.js';

export interface ISubject extends Document {
  name: string;
  class: IClass['_id'];
  code?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    code: {
      type: String,
      trim: true,
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
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

// Unique subject name per class
subjectSchema.index({ name: 1, class: 1 }, { unique: true });

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
