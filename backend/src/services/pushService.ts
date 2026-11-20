// src/services/pushService.ts — Everything about sending Web Push notifications.
// Keeps the web-push library out of controllers, so it is easy to test and to swap later.
// Saved devices are read and written through repositories/pushSubscriptionRepository.ts (Repository pattern).

import webPush from 'web-push';
import { pushSubscriptionRepository } from '../repositories/pushSubscriptionRepository';
import { isPushConfigured } from '../config/vapid';
import { isTrustedPushEndpoint } from '../utils/pushEndpoint';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

/** What the notification says and where tapping it goes */
export interface PushPayload {
  title: string;
  body: string;
  /** Page to open when the notification is tapped, e.g. "/inspections/123" */
  url?: string;
  /** Notifications with the same tag replace each other instead of piling up */
  tag?: string;
}

/** How a send went. `delivered` counts devices the push service accepted. */
export interface PushResult {
  devices: number;
  delivered: number;
  /** Devices that no longer exist (app uninstalled, permission removed); they were deleted */
  removed: number;
  failed: number;
}

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function httpError(statusCode: number, message: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/** Saves (or refreshes) one device for one user. Safe to call again for the same device. */
export async function saveSubscription(userId: string, input: SubscriptionInput): Promise<void> {
  if (!isTrustedPushEndpoint(input.endpoint)) {
    throw httpError(400, 'That notification address is not from a known browser push service.');
  }
  // A browser has one subscription however many people sign in on it. If someone else was using this
  // device before, it moves to the current person, so the last person's alerts never reach the next.
  await pushSubscriptionRepository.removeFromOtherUsers(input.endpoint, userId);
  await pushSubscriptionRepository.upsert(userId, input.endpoint, input.keys);
}

/** Forgets a device, for when the person turns notifications off */
export async function removeSubscription(userId: string, endpoint: string): Promise<void> {
  await pushSubscriptionRepository.remove(userId, endpoint);
}

/**
 * Sends one notification to every device a user has registered (phone and laptop, say).
 * Devices the push service reports as gone (404 or 410) are deleted so we stop trying them.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  const result: PushResult = { devices: 0, delivered: 0, removed: 0, failed: 0 };
  if (!isPushConfigured) return result;

  const subscriptions = await pushSubscriptionRepository.findByUser(userId);
  result.devices = subscriptions.length;
  const message = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
          message,
          // TTL: if the phone is off, the push service keeps the message for up to 12 hours
          { TTL: 12 * 60 * 60, urgency: 'normal' }
        );
        result.delivered += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await pushSubscriptionRepository.delete(subscription);
          result.removed += 1;
        } else {
          result.failed += 1;
          logger.warn(`Push to one device failed (status ${status ?? 'none'}): ${(error as Error).message}`);
        }
      }
    })
  );
  return result;
}
