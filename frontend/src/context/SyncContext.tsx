import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useOffline } from '@/context/OfflineContext'
import { addToOutbox, getOutboxFor, removeFromOutbox } from '@/services/offlineDb'
import { uploadOutbox } from '@/services/outboxUploader'
import { announceSync, subscribeToSync, type UploadSummary } from '@/services/syncEvents'
import type { OutboxEntry } from '@/types'

// Context/Provider Pattern + Observer Pattern.
// This provider owns "what is waiting to upload". It listens for the moments an upload could
// happen (the browser coming back online, the service worker finishing a Background Sync) and
// tells the rest of the app through the context. Pages just read `waiting`, `failed` and `isUploading`.

/** Name of the Background Sync registration. Must match src/sw/sw.ts. */
const UPLOAD_SYNC_TAG = 'upload-outbox'

export interface SyncContextValue {
  /** Finished checklists on this device that have not reached the server yet */
  waiting: OutboxEntry[]
  /** Ones the server refused. A person needs to look at them. */
  failed: OutboxEntry[]
  isUploading: boolean
  /** Saves a finished checklist on the device, then uploads it straight away if there is signal */
  submit: (entry: OutboxEntry) => Promise<'uploaded' | 'saved-offline'>
  /** Try uploading everything now */
  uploadNow: () => Promise<void>
  /** Throw away a refused checklist (the person has read why) */
  discard: (submissionId: string) => Promise<void>
}

export const SyncContext = createContext<SyncContextValue | undefined>(undefined)

/** Asks the browser to upload later, even if the app is closed. Not every browser supports it. */
async function requestBackgroundSync(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const syncManager = (registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync
    await syncManager?.register(UPLOAD_SYNC_TAG)
  } catch {
    // No service worker or no Background Sync: the "back online" listener below covers it
  }
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { isOnline } = useOffline()
  const [entries, setEntries] = useState<OutboxEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  // Stops two uploads running at once from this tab (the server would cope, but it wastes data)
  const isRunning = useRef(false)

  const refresh = useCallback(async () => {
    setEntries(user ? await getOutboxFor(user.id) : [])
  }, [user])

  // Load the outbox when someone signs in, and keep it fresh whenever it changes anywhere in the app
  useEffect(() => {
    void refresh()
    return subscribeToSync((event) => {
      if (event.type === 'outbox-changed') void refresh()
    })
  }, [refresh])

  const tellPerson = useCallback((summary: UploadSummary) => {
    if (summary.uploaded > 0) {
      toast.success(summary.uploaded === 1 ? 'Inspection uploaded' : `${summary.uploaded} inspections uploaded`, {
        description: 'Your offline work has reached the server.',
      })
    }
    if (summary.rejected > 0) {
      toast.error(summary.rejected === 1 ? 'One inspection could not be uploaded' : `${summary.rejected} inspections could not be uploaded`, {
        description: 'Open your inspections list to see why.',
      })
    }
  }, [])

  const uploadNow = useCallback(async () => {
    if (isRunning.current) return
    isRunning.current = true
    setIsUploading(true)
    try {
      const summary = await uploadOutbox()
      announceSync({ type: 'upload-finished', ...summary })
      announceSync({ type: 'outbox-changed' })
      tellPerson(summary)
    } finally {
      isRunning.current = false
      setIsUploading(false)
    }
  }, [tellPerson])

  // Back online, or the app opens with signal while something is still waiting: upload.
  // It reads the outbox from the device itself rather than from React state, because on first load the
  // state is still empty. (Browsers without Background Sync, such as iPhones, rely on this path.)
  // Only the connection or the person changing starts it, so a failed attempt can never retry in a loop.
  useEffect(() => {
    if (!isOnline || !user) return
    let cancelled = false
    void getOutboxFor(user.id).then((stored) => {
      if (!cancelled && stored.some((entry) => entry.state === 'waiting')) void uploadNow()
    })
    return () => {
      cancelled = true
    }
  }, [isOnline, user, uploadNow])

  // The service worker uploads in the background and reports back
  useEffect(() => {
    function handleWorkerMessage(event: MessageEvent) {
      const data = event.data as ({ type?: string } & UploadSummary) | undefined
      if (data?.type !== 'upload-finished') return
      announceSync({ type: 'upload-finished', uploaded: data.uploaded, rejected: data.rejected, waiting: data.waiting })
      announceSync({ type: 'outbox-changed' })
      tellPerson(data)
    }
    navigator.serviceWorker?.addEventListener('message', handleWorkerMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', handleWorkerMessage)
  }, [tellPerson])

  const submit = useCallback(
    async (entry: OutboxEntry) => {
      // 1. Always save on the device first, so nothing is lost if the upload fails halfway
      await addToOutbox(entry)
      announceSync({ type: 'outbox-changed' })

      // 2. With signal, send it now. Without, ask the browser to send it later.
      if (navigator.onLine) {
        await uploadNow()
        const stillThere = (await getOutboxFor(entry.userId)).some((item) => item.submissionId === entry.submissionId)
        if (!stillThere) return 'uploaded'
      }
      await requestBackgroundSync()
      return 'saved-offline'
    },
    [uploadNow]
  )

  const discard = useCallback(async (submissionId: string) => {
    await removeFromOutbox(submissionId)
    announceSync({ type: 'outbox-changed' })
  }, [])

  const value = useMemo<SyncContextValue>(
    () => ({
      waiting: entries.filter((entry) => entry.state === 'waiting'),
      failed: entries.filter((entry) => entry.state === 'failed'),
      isUploading,
      submit,
      uploadNow,
      discard,
    }),
    [entries, isUploading, submit, uploadNow, discard]
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}
