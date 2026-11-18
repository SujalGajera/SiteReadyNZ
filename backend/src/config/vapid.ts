// src/config/vapid.ts — Web Push VAPID key configuration.
// VAPID (Voluntary Application Server Identification) lets the push service verify that a
// notification really comes from our server. The private key stays in backend/.env only and is
// never sent to the browser; only the public key is shared (GET /api/push/public-key).

import webPush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

// The placeholder text from .env.example ("your_vapid_public_key_here") counts as "not set"
const isReal = (value: string | undefined): value is string => Boolean(value) && !value!.startsWith('your_');

export const isPushConfigured = isReal(vapidPublicKey) && isReal(vapidPrivateKey) && isReal(vapidEmail);

if (isPushConfigured) {
  // Register the details once; web-push then uses them on every sendNotification call
  webPush.setVapidDetails(vapidEmail as string, vapidPublicKey as string, vapidPrivateKey as string);
  console.log('✅ VAPID keys configured for Web Push');
} else {
  // The rest of the app works without push, so warn instead of stopping the server
  console.warn('⚠️  VAPID keys are not configured. Push notifications are disabled. Run: npx web-push generate-vapid-keys');
}

/** Safe to share with browsers. Empty when push is not configured. */
export const publicVapidKey = isPushConfigured ? (vapidPublicKey as string) : '';
