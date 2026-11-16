import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Inspection } from '../types'
import { useAuth } from './useAuth'

interface UseInspectionsResult {
  inspections: Inspection[]
  loading: boolean
  error: string | null
  refetch: () => void
  submitInspection: (id: string, items: Inspection['items']) => Promise<void>
}

/**
 * Fetches inspections from the server.
 * - Managers see all inspections (GET /api/inspections)
 * - Staff only see their own (GET /api/inspections/assigned/:userId)
 */
export function useInspections(): UseInspectionsResult {
  const { user, isManager } = useAuth()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInspections = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      // Determine which endpoint to call based on the user's role
      const url = isManager
        ? '/api/inspections'
        : `/api/inspections/assigned/${user.id}`
      const response = await api.get<Inspection[]>(url)
      setInspections(response.data)
    } catch (err) {
      setError('Failed to load inspections. Please check your connection.')
      console.error('Inspections fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, isManager])

  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  /** Submits a completed inspection to the server */
  const submitInspection = useCallback(
    async (id: string, items: Inspection['items']) => {
      await api.post('/api/inspections/submit', { inspectionId: id, items })
      // Refresh so the status badge updates to "completed"
      await fetchInspections()
    },
    [fetchInspections]
  )

  return { inspections, loading, error, refetch: fetchInspections, submitInspection }
}
