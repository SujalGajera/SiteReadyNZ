// server.ts — Entry point for the SiteReady NZ backend
// Loads environment variables first, then starts the Express server.

import dotenv from 'dotenv';

// Load .env before importing app so that all config modules read correct values
dotenv.config();

import app from './src/app';
import { connectToDatabase } from './src/config/db';
import Equipment from './src/models/Equipment';
import { startNotificationScheduler } from './src/jobs/notificationScheduler';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Connect to MongoDB before accepting any HTTP traffic
connectToDatabase().then(async () => {
  // Make the database indexes match the models (this drops the old global serial-number rule)
  await Equipment.syncIndexes();
  app.listen(port, () => {
    console.log(`✅ SiteReady NZ API running on http://localhost:${port}`);
    startNotificationScheduler();
  });
});
