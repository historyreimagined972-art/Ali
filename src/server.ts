import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const port = env.PORT;
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`📡 Readiness check: http://localhost:${port}/ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  const { disconnectDB } = await import('./config/db.js');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  const { disconnectDB } = await import('./config/db.js');
  await disconnectDB();
  process.exit(0);
});

startServer();
