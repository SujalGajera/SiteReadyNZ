// src/config/vapid.ts — Web Push VAPID key configuration
// VAPID (Voluntary Application Server Identification) lets the push service
// verify that notifications actually come from our server.
// Keys are set once at startup; then every push call uses them automatically.

import webPush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
  // If any VAPID config is missing, push notifications will silently fail.
  // Log a warning rather than exiting — the rest of the app still works without push.
  console.warn(
    '⚠️  VAPID keys or email are not fully configured. Push notifications will not work.'
  );
} else {
  // Register the VAPID details globally so web-push uses them on every sendNotification call
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  console.log('✅ VAPID keys configured for Web Push');
}

// Export the public key so the frontend can use it when subscribing to push
export const publicVapidKey = vapidPublicKey ?? '';
