import mongoose, { Document, Schema } from 'mongoose';
import { ISubject } from '../subjects/subject.model.js';

export interface IChannel extends Document {
  name: string;
  youtubeChannelId?: string;
  youtubePlaylistId?: string;
  subject: ISubject['_id'];
  board?: string;
  isApproved: boolean;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      maxlength: [200, 'Channel name cannot exceed 200 characters'],
    },
    youtubeChannelId: {
      type: String,
      trim: true,
    },
    youtubePlaylistId: {
      type: String,
      trim: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    board: {
      type: String,
      trim: true,
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

// Channel can be used for multiple subjects
channelSchema.index({ youtubeChannelId: 1 }, { sparse: true });
channelSchema.index({ youtubePlaylistId: 1 }, { sparse: true });

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);
