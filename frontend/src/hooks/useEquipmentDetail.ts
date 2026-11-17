import { useEffect, useState } from 'react'
import { fetchEquipmentById } from '@/services/equipmentApi'
import { getErrorMessage } from '@/services/api'
import type { Equipment } from '@/types'

/** Loads one equipment item for the detail page */
export function useEquipmentDetail(id: string | undefined) {
  const [item, setItem] = useState<Equipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchEquipmentById(id)
      .then((loaded) => !cancelled && setItem(loaded))
      .catch((loadError) => !cancelled && setError(getErrorMessage(loadError, 'Could not load this item.')))
      .finally(() => !cancelled && setIsLoading(false))

    // If the user navigates away mid-request, ignore the late answer
    return () => {
      cancelled = true
    }
  }, [id])

  return { item, isLoading, error }
}
