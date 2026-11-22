// sw/registerServiceWorker.ts — Registers the service worker (sw/sw.ts) with the browser.
//
// Registering is what tells the browser "this file is my service worker". After that the browser installs it,
// activates it, and lets it answer network requests, which is what makes the app open with no signal.
// vite-plugin-pwa turns `virtual:pwa-register` into the real registration code at build time, and with
// registerType "autoUpdate" a new version of the app replaces the old worker by itself.

import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker(): void {
  // `immediate` registers as soon as the app starts, without waiting for the page "load" event
  registerSW({ immediate: true })
}
