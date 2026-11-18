/// <reference lib="webworker" />
// sw/sw.ts — SiteReady's service worker. It runs in the background, separate from the page.
//
// Three jobs:
//   1. Keep the app itself on the device (precache), so it opens with no signal.
//   2. Keep the last answers from the API (Network First: use the network, fall back to the copy).
//   3. Upload finished checklists when the connection returns, even if the app is closed (Background Sync).

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { uploadOutbox } from '@/services/outboxUploader'

declare const self: ServiceWorkerGlobalScope & {
  // The Background Sync event is not in TypeScript's built-in worker types yet
  addEventListener(type: 'sync', listener: (event: SyncEvent) => void): void
}

interface SyncEvent extends ExtendableEvent {
  readonly tag: string
}

/** Name of the Background Sync registration. The page uses the same name when it asks for a sync. */
const UPLOAD_SYNC_TAG = 'upload-outbox'

// A new version takes over straight away instead of waiting for every tab to close
void self.skipWaiting()
clientsClaim()

// 1. The app shell. The list of files is filled in at build time.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Any page address (/equipment, /inspections/123 ...) opens the same single-page app.
// Backend addresses are left alone so a missing server is not hidden behind the app.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/auth\//, /^\/api\//] }))

// 2. Reading data. Only GET requests are cached; anything that changes data goes to the outbox instead.
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 6, // on a very slow connection, show the saved copy rather than wait forever
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }), // never keep an error answer
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
)

// 3. Uploading finished checklists
async function uploadAndTellPages(): Promise<void> {
  const summary = await uploadOutbox()

  // Let any open page know, so it can refresh its list and show a message
  const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const page of pages) page.postMessage({ type: 'upload-finished', ...summary })

  // Throwing tells the browser "not finished", so it tries again later with a growing delay
  if (summary.waiting > 0) throw new Error('Some checklists are still waiting to upload')
}

self.addEventListener('sync', (event) => {
  if (event.tag === UPLOAD_SYNC_TAG) event.waitUntil(uploadAndTellPages())
})

// 4. Push notifications. The server sends JSON like { title, body, url, tag }.

/** A path inside this app, or "/" if the server sent anything else (so a notification can never lead off-site) */
function safeAppPath(candidate: unknown): string {
  if (typeof candidate !== 'string') return '/'
  try {
    const target = new URL(candidate, self.location.origin)
    return target.origin === self.location.origin ? target.pathname + target.search : '/'
  } catch {
    return '/'
  }
}

self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; url?: string; tag?: string } = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() } // not JSON: show it as plain text
  }

  // Every push must show a notification (browsers require it), so fall back to a generic one
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'SiteReady NZ', {
      body: data.body ?? 'You have a new update.',
      icon: '/icons/icon-192.png',
      tag: data.tag, // the same tag replaces an older notification instead of stacking up
      data: { url: safeAppPath(data.url) },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(safeAppPath((event.notification.data as { url?: string } | undefined)?.url), self.location.origin).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      // If the app is already open somewhere, bring it forward and go to the right page
      for (const open of windows) {
        if ('focus' in open) {
          await open.focus()
          if ('navigate' in open) await open.navigate(target)
          return
        }
      }
      await self.clients.openWindow(target)
    })()
  )
})
