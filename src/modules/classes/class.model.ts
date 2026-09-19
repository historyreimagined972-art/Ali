import mongoose, { Document, Schema } from 'mongoose';
import { IBoard } from '../boards/board.model.js';

export interface IClass extends Document {
  name: string;
  board: IBoard['_id'];
  grade: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      maxlength: [50, 'Class name cannot exceed 50 characters'],
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board is required'],
    },
    grade: {
      type: Number,
      required: [true, 'Grade number is required'],
      min: [1, 'Grade must be at least 1'],
      max: [12, 'Grade cannot exceed 12'],
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

// Unique class name per board
classSchema.index({ name: 1, board: 1 }, { unique: true });

export const Class = mongoose.model<IClass>('Class', classSchema);
