// src/controllers/pushController.ts — HTTP handlers for push notifications.
// Read the request, call the service, send the response.

import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { rejectIfInvalid } from '../utils/validation';
import { isPushConfigured, publicVapidKey } from '../config/vapid';
import { removeSubscription, saveSubscription, sendPushToUser, type SubscriptionInput } from '../services/pushService';
import { runNotificationSweep } from '../services/notificationService';

/** GET /api/push/public-key — the key the browser needs to subscribe (200), or 503 if push is switched off */
export function getPublicKey(_req: Request, res: Response): void {
  if (!isPushConfigured) {
    res.status(503).json({ error: 'Push notifications are not set up on this server.' });
    return;
  }
  res.status(200).json({ publicKey: publicVapidKey });
}

/** POST /api/push/subscribe — remember this device for the signed-in user (200). Repeating it is safe. */
export async function subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    await saveSubscription(req.user!.id, req.body as SubscriptionInput);
    res.status(200).json({ message: 'This device will now get notifications.' });
  } catch (error) {
    next(error);
  }
}

/** POST /api/push/unsubscribe — forget this device (204) */
export async function unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    await removeSubscription(req.user!.id, (req.body as { endpoint: string }).endpoint);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/push/send — a manager sends a notification to one person in their own workspace (200).
 * The answer says how many of that person's devices received it (0 if they have not turned
 * notifications on yet).
 */
export async function sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    const { targetUserId, title, body, url } = req.body as { targetUserId: string; title: string; body: string; url?: string };

    // The target must be in the manager's own workspace. Another business's user looks like a missing user.
    const target = await User.findOne({ _id: targetUserId, organisationId: req.user!.orgId });
    if (!target) {
      res.status(404).json({ error: 'That person is not in your workspace.' });
      return;
    }

    const result = await sendPushToUser(String(target._id), { title, body, url, tag: 'manager-message' });
    const message =
      result.devices === 0
        ? 'That person has not turned notifications on yet.'
        : result.delivered > 0
          ? 'Notification sent.'
          : 'The notification could not be delivered to that person\u2019s device.';
    res.status(200).json({ ...result, message });
  } catch (error) {
    next(error);
  }
}

/** POST /api/push/run-checks — run the reminder and overdue checks for this workspace right now (200) */
export async function runChecks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await runNotificationSweep({ organisationId: req.user!.orgId }));
  } catch (error) {
    next(error);
  }
}
