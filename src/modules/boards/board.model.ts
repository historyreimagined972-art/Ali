import mongoose, { Document, Schema } from 'mongoose';

export interface IBoard extends Document {
  name: string;
  code: string;
  country: string;
  province: string;
  districts: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoard>(
  {
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
      maxlength: [100, 'Board name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Board code is required'],
      trim: true,
      maxlength: [30, 'Board code cannot exceed 30 characters'],
      uppercase: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Pakistan',
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true,
      default: 'Punjab',
    },
    districts: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique board code globally
boardSchema.index({ code: 1 }, { unique: true });
// Unique board name per country
boardSchema.index({ name: 1, country: 1 }, { unique: true });

export const Board = mongoose.model<IBoard>('Board', boardSchema);
