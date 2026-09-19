import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.js';

// Use Google DNS to resolve MongoDB Atlas hostnames
dns.setServers(['8.8.8.8', '8.8.4.4']);

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
}

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});
