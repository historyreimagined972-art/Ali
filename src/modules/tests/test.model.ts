import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  number: number;
  type: 'mcq' | 'short' | 'long';
  question: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
  rubric?: string;
}

export interface ITest extends Document {
  title: string;
  instructions: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questions: IQuestion[];
  totalMarks: number;
  board?: string;
  classLevel?: string;
  subject?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      trim: true,
    },
    topics: [{
      type: String,
      required: true,
    }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: [true, 'Difficulty is required'],
    },
    questions: [{
      number: { type: Number, required: true },
      type: { type: String, enum: ['mcq', 'short', 'long'], required: true },
      question: { type: String, required: true },
      marks: { type: Number, required: true },
      options: [String],
      correctAnswer: String,
      rubric: String,
    }],
    totalMarks: {
      type: Number,
      required: true,
    },
    board: String,
    classLevel: String,
    subject: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Test = mongoose.model<ITest>('Test', testSchema);
