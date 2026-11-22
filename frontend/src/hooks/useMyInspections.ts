import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchAssignedInspections } from '@/services/inspectionApi'
import { cacheInspections, getCachedInspections, getDrafts } from '@/services/offlineDb'
import { getErrorMessage, isNetworkError } from '@/services/api'
import { subscribeToSync } from '@/services/syncEvents'
import { useIsMounted } from '@/hooks/useIsMounted'
import type { Inspection } from '@/types'

/**
 * A staff member's own task list.
 * Online: loads from the server and keeps a copy on the device.
 * Offline: shows that copy, and says how old it is.
 */
export function useMyInspections() {
  const { user } = useAuth()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** When the list on screen was last downloaded, if it came from the device copy */
  const [offlineCopySavedAt, setOfflineCopySavedAt] = useState<string | null>(null)
  /** inspectionId -> how many questions are answered in a draft saved on this device */
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({})
  const isMounted = useIsMounted()

  const load = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      const fresh = await fetchAssignedInspections(user.id)
      if (isMounted()) {
        setInspections(fresh)
        setOfflineCopySavedAt(null)
      }
      await cacheInspections(user.id, fresh) // the copy that works with no signal
    } catch (loadError) {
      const cached = await getCachedInspections(user.id)
      if (!isMounted()) return
      if (isNetworkError(loadError) && cached.savedAt) {
        setInspections(cached.inspections)
        setOfflineCopySavedAt(cached.savedAt)
      } else {
        setError(getErrorMessage(loadError, 'Could not load your inspections.'))
      }
    } finally {
      const drafts = await getDrafts(user.id)
      if (isMounted()) {
        setDraftCounts(Object.fromEntries(drafts.map((draft) => [draft.inspectionId, Object.keys(draft.answers).length])))
        setIsLoading(false)
      }
    }
  }, [user, isMounted])

  useEffect(() => {
    void load()
  }, [load])

  // After an upload finishes (here or in the service worker) the server's list has changed
  useEffect(() => {
    return subscribeToSync((event) => {
      if (event.type === 'upload-finished' && event.uploaded > 0) void load()
    })
  }, [load])

  return { inspections, isLoading, error, offlineCopySavedAt, draftCounts, reload: load }
}
