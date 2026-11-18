// services/outboxUploader.ts — Sends waiting checklists to the server.
//
// Used in two places: by the service worker (Background Sync, even with the app closed) and by the
// page (when the browser says it is online again, and right after Submit). Both can run at once,
// and that is safe: the server ignores a second upload with the same `submissionId`.
//
// No window, no React and no Axios here, so the service worker can import it.

import type { OutboxEntry } from '@/types'
import { getAllOutbox, markOutboxFailed, removeFromOutbox } from '@/services/offlineDb'
import type { UploadSummary } from '@/services/syncEvents'

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/** What happened to one upload attempt */
export type UploadOutcome =
  | { kind: 'uploaded' }
  | { kind: 'queued'; reason: 'offline' | 'signed-out' | 'other-account' | 'server-busy' } // keep it, try again later
  | { kind: 'rejected'; message: string } // the server said no; retrying will not help

/** Sends one entry. Never throws: every result is one of the outcomes above. */
export async function uploadEntry(entry: OutboxEntry): Promise<UploadOutcome> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/inspections/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The login lives in an httpOnly cookie, so ask the browser to send it
      credentials: 'include',
      body: JSON.stringify({
        inspectionId: entry.inspectionId,
        submissionId: entry.submissionId,
        completedAt: entry.completedAt,
        items: entry.items,
      }),
    })
  } catch {
    // fetch only throws when the request never reached the server: no signal, or server down
    return { kind: 'queued', reason: 'offline' }
  }

  if (response.ok) return { kind: 'uploaded' }
  if (response.status === 401) return { kind: 'queued', reason: 'signed-out' } // wait until someone signs in
  // Someone else is signed in on this phone. The checklist belongs to a different person, so keep it for them.
  if (response.status === 403) return { kind: 'queued', reason: 'other-account' }
  if (response.status >= 500 || response.status === 429) return { kind: 'queued', reason: 'server-busy' }

  // 400, 404, 409: the server understood and refused. Show the reason to a person.
  let message = 'The server could not accept this checklist.'
  try {
    const body = (await response.json()) as { error?: string }
    if (body.error) message = body.error
  } catch {
    // keep the default message
  }
  return { kind: 'rejected', message }
}

/**
 * Tries every waiting entry, oldest first. Stops early when there is clearly no point continuing
 * (offline or signed out), so a long outbox does not hammer a dead connection.
 */
export async function uploadOutbox(): Promise<UploadSummary> {
  const entries = (await getAllOutbox())
    .filter((entry) => entry.state === 'waiting')
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))

  const summary: UploadSummary = { uploaded: 0, rejected: 0, waiting: 0 }

  for (const [index, entry] of entries.entries()) {
    const outcome = await uploadEntry(entry)

    if (outcome.kind === 'uploaded') {
      await removeFromOutbox(entry.submissionId)
      summary.uploaded += 1
    } else if (outcome.kind === 'rejected') {
      await markOutboxFailed(entry.submissionId, outcome.message)
      summary.rejected += 1
    } else if (outcome.reason === 'other-account') {
      // Not this person's checklist. Leave it alone and carry on with the rest.
      summary.waiting += 1
    } else {
      // No signal, signed out, or the server is busy: the rest would fail the same way
      summary.waiting += entries.length - index
      break
    }
  }
  return summary
}
