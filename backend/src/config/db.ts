// src/config/db.ts — MongoDB connection setup
// Encapsulates the Mongoose connect call so we can call it once from server.ts
// and easily mock it in tests.

import mongoose from 'mongoose';
import logger from './logger';

export async function connectToDatabase(): Promise<void> {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    // Fail fast — there is no sensible default URI to fall back on
    logger.error('MONGODB_URI is not set in environment variables. Exiting.');
    process.exit(1);
  }

  try {
    await mongoose.connect(connectionString);
    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    // Log the actual error so the developer can diagnose the problem
    logger.error('MongoDB connection failed', { message: (error as Error).message });
    // Exit the process — running without a database is pointless for this app
    process.exit(1);
  }
}
