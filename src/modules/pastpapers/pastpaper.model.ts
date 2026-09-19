import mongoose, { Document, Schema } from 'mongoose';
import { IBoard } from '../boards/board.model.js';
import { IClass } from '../classes/class.model.js';
import { ISubject } from '../subjects/subject.model.js';

export interface IPastPaper extends Document {
  title: string;
  board: IBoard['_id'];
  class: IClass['_id'];
  subject: ISubject['_id'];
  year: number;
  fileUrl: string;
  fileName: string;
  extractedText?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const pastPaperSchema = new Schema<IPastPaper>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board is required'],
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    extractedText: {
      type: String,
      select: false,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying past papers
pastPaperSchema.index({ board: 1, class: 1, subject: 1, year: -1 });

export const PastPaper = mongoose.model<IPastPaper>('PastPaper', pastPaperSchema);
