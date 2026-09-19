import mongoose, { Document, Schema } from 'mongoose';
import { ITest } from './test.model.js';

export interface IAnswer {
  questionNumber: number;
  type: 'mcq' | 'short' | 'long';
  studentAnswer: string;
  isCorrect?: boolean;
  score?: number;
  maxScore: number;
  feedback?: string;
}

export interface IAttempt extends Document {
  test: ITest['_id'];
  student: mongoose.Types.ObjectId;
  answers: IAnswer[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: 'in_progress' | 'submitted' | 'graded';
  startedAt: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attemptSchema = new Schema<IAttempt>(
  {
    test: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [{
      questionNumber: { type: Number, required: true },
      type: { type: String, enum: ['mcq', 'short', 'long'], required: true },
      studentAnswer: { type: String, default: '' },
      isCorrect: Boolean,
      score: Number,
      maxScore: { type: Number, required: true },
      feedback: String,
    }],
    totalScore: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded'],
      default: 'in_progress',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: Date,
    gradedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for querying attempts by student and test
attemptSchema.index({ student: 1, test: 1 });

export const Attempt = mongoose.model<IAttempt>('Attempt', attemptSchema);
