// src/app.ts — Express application bootstrap
// Sets up all middleware and mounts every route group.
// Kept separate from server.ts so the app can be imported in tests without starting a real server.

import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import inspectionRoutes from './routes/inspectionRoutes';
import pushRoutes from './routes/pushRoutes';
import staffRoutes from './routes/staffRoutes';
import { globalErrorHandler } from './middleware/errorHandler';

const app: Application = express();

// Adds standard protective HTTP headers (no MIME sniffing, no framing, and so on)
app.use(helmet());

// Allow requests only from the configured frontend origin.
// Using a specific origin rather than '*' is required for security (CORS spec also
// blocks credentials on wildcard origins).
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies / Authorization headers to be sent cross-origin
  })
);

// Parse incoming JSON bodies so controllers receive plain objects. The size cap stops
// someone posting a huge body to exhaust memory.
app.use(express.json({ limit: '1mb' }));

// Makes the httpOnly login cookie available as req.cookies
app.use(cookieParser());

// Log every request to the console in development-friendly format
app.use(morgan('dev'));

// ----- Route mounts -----
// Auth routes handle register, login and Google OAuth — no JWT guard here
app.use('/auth', authRoutes);

// Feature routes all require a valid JWT (enforced inside each router)
app.use('/api/equipment', equipmentRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/staff', staffRoutes);

// Global error handler must be registered LAST so Express recognises it as an
// error-handling middleware (four-argument signature)
app.use(globalErrorHandler);

export default app;
