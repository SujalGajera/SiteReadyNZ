// src/services/pushService.ts — Business logic for sending Web Push notifications
// Keeps the web-push library interaction out of the controller, making it
// easier to test and swap out the push mechanism in the future (Repository/Service pattern).

import webPush from 'web-push';
import PushSubscription from '../models/PushSubscription';

// Shape of the notification payload sent to the browser
interface PushPayload {
  title: string;
  body: string;
  url?: string; // Optional deep-link the user is taken to when they tap the notification
}

/**
 * Finds all active push subscriptions for a user and sends a notification to each.
 * A user may have subscriptions on multiple devices — we send to all of them.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  // Retrieve every subscription this user has stored (could be phone + laptop, etc.)
  const subscriptions = await PushSubscription.find({ userId });

  if (subscriptions.length === 0) {
    // The user has no subscriptions — they may not have granted notification permission yet
    console.warn(`No push subscriptions found for user ${userId}`);
    return;
  }

  // Build the JSON string once — reused for every device
  const notificationPayload = JSON.stringify(payload);

  // Send to all subscriptions in parallel for speed
  const sendPromises = subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
        notificationPayload
      );
    } catch (sendError) {
      // Log the failure for this specific device but don't block the others.
      // A 410 Gone error from the push service means the subscription is expired
      // and should be removed from the database.
      console.error(
        `Failed to send push to endpoint ${subscription.endpoint}:`,
        sendError
      );
    }
  });

  await Promise.allSettled(sendPromises); // Wait for all attempts, succeeded or not
}
