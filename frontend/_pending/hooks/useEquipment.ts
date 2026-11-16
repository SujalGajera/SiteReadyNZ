import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Equipment } from '../types'

interface UseEquipmentResult {
  equipment: Equipment[]
  loading: boolean
  error: string | null
  refetch: () => void
  createEquipment: (data: Omit<Equipment, '_id' | 'status' | 'lastInspectedAt'>) => Promise<void>
  updateEquipment: (id: string, data: Partial<Equipment>) => Promise<void>
  deleteEquipment: (id: string) => Promise<void>
}

/**
 * Custom hook that owns all equipment data fetching and mutation.
 * Business logic lives here — the Dashboard page stays thin (just renders).
 */
export function useEquipment(): UseEquipmentResult {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEquipment = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<Equipment[]>('/api/equipment')
      setEquipment(response.data)
    } catch (err) {
      setError('Failed to load equipment. Please try again.')
      console.error('Equipment fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on first render
  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  const createEquipment = useCallback(
    async (data: Omit<Equipment, '_id' | 'status' | 'lastInspectedAt'>) => {
      await api.post('/api/equipment', data)
      // Refresh the list so the new item appears without a full page reload
      await fetchEquipment()
    },
    [fetchEquipment]
  )

  const updateEquipment = useCallback(
    async (id: string, data: Partial<Equipment>) => {
      await api.put(`/api/equipment/${id}`, data)
      await fetchEquipment()
    },
    [fetchEquipment]
  )

  const deleteEquipment = useCallback(
    async (id: string) => {
      await api.delete(`/api/equipment/${id}`)
      // Remove immediately from local state for snappy feedback before refetch
      setEquipment((prev) => prev.filter((item) => item._id !== id))
    },
    []
  )

  return {
    equipment,
    loading,
    error,
    refetch: fetchEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  }
}
