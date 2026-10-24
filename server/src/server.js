import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const startServer = async () => {
  const app = createApp();

  // Initialize database connectivity (non-blocking in Phase 1)
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`
🚀 Smart Task Platform Backend Running!
📡 Environment: ${env.NODE_ENV}
🌐 Server URL:  http://localhost:${env.PORT}
🩺 Health Check: http://localhost:${env.PORT}/api/v1/health
    `);
  });

  const handleShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('✅ Server and database closed cleanly. Exiting.');
      process.exit(0);
    });

    // Force shutdown if taking too long
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

startServer();
