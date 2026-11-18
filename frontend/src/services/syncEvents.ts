// services/syncEvents.ts — Observer Pattern for upload progress.
//
// The code that uploads finished checklists (in the page, or in the service worker) does not know
// who is interested in the result. It just announces "the outbox changed" or "N inspections were
// uploaded". Anything that cares (the sync context, a toast, a badge) subscribes. Adding another
// listener never touches the uploader.

export interface UploadSummary {
  /** How many checklists reached the server this time */
  uploaded: number
  /** How many the server refused (they stay in the outbox marked "failed") */
  rejected: number
  /** How many are still waiting (no signal, or a temporary server error) */
  waiting: number
}

export type SyncEvent = { type: 'outbox-changed' } | ({ type: 'upload-finished' } & UploadSummary)

type SyncListener = (event: SyncEvent) => void

const listeners = new Set<SyncListener>()

/** Start listening. Returns the function that stops listening. */
export function subscribeToSync(listener: SyncListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function announceSync(event: SyncEvent): void {
  listeners.forEach((listener) => listener(event))
}
