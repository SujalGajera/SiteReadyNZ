import { useState, useEffect, useCallback } from 'react'
import { useOffline } from '../context/OfflineContext'
import {
  getOfflineSubmissions,
  deleteOfflineSubmission,
} from '../services/indexedDB'
import { api } from '../services/api'
import type { Inspection } from '../types'

interface UseOfflineSyncResult {
  /** Number of inspections waiting to sync to the server */
  pendingCount: number
  /** True while the sync is in progress */
  isSyncing: boolean
  /** Number of items synced in the most recent successful sync run */
  lastSyncedCount: number
}

/**
 * Observer Pattern: this hook watches OfflineContext for the moment the app
 * comes back online, then automatically uploads any queued inspections.
 * Components observe this hook's state to show sync feedback without knowing
 * the internals of the upload process.
 */
export function useOfflineSync(): UseOfflineSyncResult {
  const { isOnline } = useOffline()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedCount, setLastSyncedCount] = useState(0)

  /** Uploads all queued offline inspections to the server */
  const syncPendingInspections = useCallback(async () => {
    const pending = await getOfflineSubmissions()
    setPendingCount(pending.length)

    if (pending.length === 0) return

    setIsSyncing(true)
    let synced = 0

    for (const inspection of pending) {
      try {
        // Try to submit each queued inspection
        await api.post<Inspection>('/api/inspections/submit', inspection)
        // Remove from the outbox only after a confirmed successful upload
        await deleteOfflineSubmission(inspection._id)
        synced++
      } catch (error) {
        // If one fails, skip it and try the rest — it stays in the queue
        console.error(`Failed to sync inspection ${inspection._id}:`, error)
      }
    }

    setIsSyncing(false)
    setLastSyncedCount(synced)

    // Recount what is still pending after the sync run
    const stillPending = await getOfflineSubmissions()
    setPendingCount(stillPending.length)
  }, [])

  // Check queue count on mount so the UI reflects reality immediately
  useEffect(() => {
    getOfflineSubmissions()
      .then((items) => setPendingCount(items.length))
      .catch(console.error)
  }, [])

  // Trigger a sync whenever the browser comes back online
  useEffect(() => {
    if (isOnline) {
      syncPendingInspections().catch(console.error)
    }
  }, [isOnline, syncPendingInspections])

  return { pendingCount, isSyncing, lastSyncedCount }
}
