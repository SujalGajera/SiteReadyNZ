// src/utils/pushEndpoint.ts — Decides whether a push "endpoint" address can be trusted.
//
// Why this exists: the browser tells us the address to POST notifications to. If we accepted any
// address, someone could register `http://localhost:27017` or `http://169.254.169.254/...` and make
// our server send requests to internal systems (an SSRF attack). Real browsers only ever hand out
// addresses on their vendor's push service, so we accept only those.

const TRUSTED_PUSH_HOSTS: (string | RegExp)[] = [
  'fcm.googleapis.com', // Chrome, Edge, Opera, Brave, Android
  /^[a-z0-9-]+\.push\.services\.mozilla\.com$/, // Firefox (updates.push.services.mozilla.com and regional ones)
  /^[a-z0-9.-]+\.notify\.windows\.com$/, // older Edge / Windows
  /^[a-z0-9.-]*push\.apple\.com$/, // Safari, iOS, macOS (web.push.apple.com)
];

/** True only for https addresses on a known push service */
export function isTrustedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return TRUSTED_PUSH_HOSTS.some((allowed) => (typeof allowed === 'string' ? host === allowed : allowed.test(host)));
}
