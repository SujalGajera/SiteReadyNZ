import { api } from './api'
import type { PushSubscriptionData } from '../types'

/**
 * Converts a URL-safe base64 string (the VAPID public key format) to a
 * Uint8Array that the PushManager.subscribe() API requires.
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  // Pad the string so its length is a multiple of 4 (base64 requirement)
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  // Return a plain ArrayBuffer — this is what PushManager.subscribe expects
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

/**
 * Requests push notification permission from the user, subscribes to the
 * browser's Push API, then registers the subscription on the server so the
 * backend can send notifications to this device.
 */
export async function subscribeToPush(): Promise<void> {
  // Check the browser supports push notifications at all
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser')
    return
  }

  // Ask the user for permission — if they deny, we degrade gracefully
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('Push notification permission was denied by the user')
    return
  }

  const registration = await navigator.serviceWorker.ready

  // Subscribe using the VAPID public key from env — the private key never leaves the server
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true, // Required: notifications must be visible to the user
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.VITE_VAPID_PUBLIC_KEY
    ),
  })

  // Convert the PushSubscription object to our typed format before sending
  const subscriptionData: PushSubscriptionData = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(
        String.fromCharCode(
          ...new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer)
        )
      ),
      auth: btoa(
        String.fromCharCode(
          ...new Uint8Array(subscription.getKey('auth') as ArrayBuffer)
        )
      ),
    },
  }

  // Register the subscription on the backend so it can send targeted pushes
  await api.post('/api/push/subscribe', subscriptionData)
}
