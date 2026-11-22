// server.ts — Entry point for the SiteReady NZ backend
// Loads environment variables first, then starts the Express server.

import dotenv from 'dotenv';

// Load .env before importing app so that all config modules read correct values
dotenv.config();

import app from './src/app';
import { connectToDatabase } from './src/config/db';
import { equipmentRepository } from './src/repositories/equipmentRepository';
import { startNotificationScheduler } from './src/jobs/notificationScheduler';
import logger from './src/config/logger';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Connect to MongoDB before accepting any HTTP traffic
connectToDatabase()
  .then(async () => {
    // Make the database indexes match the models (this drops the old global serial-number rule)
    await equipmentRepository.syncIndexes();
    app.listen(port, () => {
      logger.info(`SiteReady NZ API running on http://localhost:${port}`);
      startNotificationScheduler();
    });
  })
  .catch((error: unknown) => {
    // Without this, a failure while starting would be an unhandled promise rejection with no clear message
    logger.error('The server could not start', { message: (error as Error).message });
    process.exit(1);
  });
