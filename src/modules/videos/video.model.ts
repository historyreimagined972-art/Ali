import mongoose, { Document, Schema } from 'mongoose';
import { ITopic } from '../topics/topic.model.js';
import { IChannel } from '../channels/channel.model.js';

export interface IVideo extends Document {
  youtubeVideoId: string;
  title: string;
  topic: ITopic['_id'];
  channel: IChannel['_id'];
  transcript?: string;
  duration?: number;
  thumbnailUrl?: string;
  isApproved: boolean;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    youtubeVideoId: {
      type: String,
      required: [true, 'YouTube video ID is required'],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters'],
    },
    topic: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: [true, 'Channel is required'],
    },
    transcript: {
      type: String,
      select: false,
    },
    duration: {
      type: Number, // in seconds
    },
    thumbnailUrl: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying videos by topic
videoSchema.index({ topic: 1, isApproved: 1 });

// Text index for search
videoSchema.index({ title: 'text' });

export const Video = mongoose.model<IVideo>('Video', videoSchema);
