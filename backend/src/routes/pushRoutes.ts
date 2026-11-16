// src/routes/pushRoutes.ts — Route definitions for Web Push notification endpoints
// All users can subscribe (they store their own device subscription).
// Only managers can trigger outbound notifications to other users.

import { Router } from 'express';
import { requireAuthentication } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import { subscribe, sendNotification } from '../controllers/pushController';

const pushRouter = Router();

// Any authenticated user can register their device to receive push notifications
pushRouter.post('/subscribe', requireAuthentication, subscribe);

// Only managers can send push notifications — prevents staff from spamming each other
pushRouter.post(
  '/send',
  requireAuthentication,
  requireRole('manager'),
  sendNotification
);

export default pushRouter;
