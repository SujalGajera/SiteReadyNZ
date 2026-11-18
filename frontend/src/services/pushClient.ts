// services/pushClient.ts — The browser's side of Web Push: asking permission and subscribing.
// The server's side (sending) lives in the backend. Nothing here touches React.

import { api } from '@/services/api'

/** What the notification card needs to know */
export type PushState =
  | 'unsupported' // this browser cannot do push (or an iPhone where the app is not installed yet)
  | 'denied' // the person (or the browser) blocked notifications for this site
  | 'off' // possible, but not switched on
  | 'on' // subscribed, and the server knows about this device

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** The browser's public key arrives as base64url text, but subscribe() wants raw bytes */
function keyToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}

/**
 * The service worker registration. `navigator.serviceWorker.ready` waits forever if no service worker
 * ever starts (for example, it failed to install), and signing out must never hang on that, so give up after 4 seconds.
 */
async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Service worker is not ready')), 4000))
  return Promise.race([navigator.serviceWorker.ready, timeout])
}

/** Works out the current state without asking the person anything */
export async function readPushState(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const subscription = await (await getRegistration()).pushManager.getSubscription()
  return subscription && Notification.permission === 'granted' ? 'on' : 'off'
}

/**
 * Asks permission, subscribes this browser, and tells the server about it.
 * Returns the resulting state; 'denied' means the person said no, which is a normal answer, not an error.
 */
export async function enablePush(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const { data } = await api.get<{ publicKey: string }>('/api/push/public-key')
  const registration = await getRegistration()
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(data.publicKey) }))

  await api.post('/api/push/subscribe', subscription.toJSON())
  return 'on'
}

/** Switches off: tells the server to forget this device, then removes the browser subscription */
export async function disablePush(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'
  const subscription = await (await getRegistration()).pushManager.getSubscription()
  if (subscription) {
    await api.post('/api/push/unsubscribe', { endpoint: subscription.endpoint })
    await subscription.unsubscribe()
  }
  return 'off'
}

/**
 * Makes sure the server links this device to whoever is signed in now. On a shared phone the
 * browser keeps ONE subscription however many people sign in, so each sign-in re-registers it.
 */
export async function rebindDeviceToCurrentUser(): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return
  const subscription = await (await getRegistration()).pushManager.getSubscription()
  if (subscription) await api.post('/api/push/subscribe', subscription.toJSON())
}

/**
 * Called when someone signs out: the server stops sending their alerts to this device.
 * The browser subscription stays, so signing in again (or someone else signing in) can reuse it.
 */
export async function detachDeviceFromCurrentUser(): Promise<void> {
  if (!isPushSupported()) return
  const subscription = await (await getRegistration()).pushManager.getSubscription()
  if (subscription) await api.post('/api/push/unsubscribe', { endpoint: subscription.endpoint })
}
