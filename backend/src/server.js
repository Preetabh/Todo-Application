const path = require('path');
// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');
const { provisionInitialAdmin } = require('./services/adminProvision.service');
const { startScheduler, stopScheduler } = require('./services/scheduler.service');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = '0.0.0.0'; // Bind to 0.0.0.0 for LAN/mobile and Render deployment

let server;

// Start server function
const startServer = async () => {
  try {
    // 1. Connect to MongoDB before accepting traffic
    await connectDB();

    // 2. Provision initial administrator securely if not already present
    await provisionInitialAdmin();

    // 3. Start persistent background push campaign scheduler & receipt engine
    startScheduler();

    // 4. Start HTTP server
    server = app.listen(PORT, HOST, () => {
      logger.info(`Server is running at http://${HOST}:${PORT}`);
      logger.info(`Health check available at http://${HOST}:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopScheduler();
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run server
startServer();
