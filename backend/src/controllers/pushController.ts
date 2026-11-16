// src/controllers/pushController.ts — Web Push notification endpoints
// Handles storing browser push subscriptions and sending notifications to users.
// The actual send logic lives in pushService.ts (single responsibility principle).

import { Request, Response, NextFunction } from 'express';
import PushSubscription from '../models/PushSubscription';
import { sendPushToUser } from '../services/pushService';

/**
 * POST /api/push/subscribe
 * Saves or updates a browser push subscription for the authenticated user.
 * Uses upsert so calling this multiple times for the same device is idempotent.
 */
export async function subscribe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { endpoint, keys } = req.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Missing required subscription fields: endpoint, keys.p256dh, keys.auth' });
      return;
    }

    // Upsert — update if the endpoint already exists, create if it does not.
    // This prevents duplicate subscriptions for the same device.
    await PushSubscription.findOneAndUpdate(
      { userId, endpoint },
      { userId, endpoint, keys },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Push subscription saved successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/push/send
 * Triggers a push notification to a specific user (by userId).
 * Only managers can call this endpoint (enforced in the route definition).
 */
export async function sendNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { targetUserId, title, body, url } = req.body as {
      targetUserId: string;
      title: string;
      body: string;
      url?: string;
    };

    if (!targetUserId || !title || !body) {
      res.status(400).json({ error: 'targetUserId, title, and body are all required.' });
      return;
    }

    // Delegate the actual send to the service layer — the controller should not
    // know the details of how web-push works
    await sendPushToUser(targetUserId, { title, body, url });

    res.status(200).json({ message: 'Notification sent successfully.' });
  } catch (error) {
    next(error);
  }
}
