import { useCallback, useEffect, useState } from 'react'
import * as equipmentApi from '@/services/equipmentApi'
import { getErrorMessage } from '@/services/api'
import type { Equipment, EquipmentFormValues } from '@/types'

/**
 * Loads the equipment list and offers add / change / remove actions.
 * Pages never call the API themselves (AGENT_RULES: no data fetching inside pages).
 */
export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setEquipment(await equipmentApi.fetchEquipment())
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load the equipment list.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const addEquipment = useCallback(async (values: EquipmentFormValues) => {
    const created = await equipmentApi.createEquipment(values)
    setEquipment((current) => [...current, created])
    return created
  }, [])

  const changeEquipment = useCallback(async (id: string, values: EquipmentFormValues) => {
    const updated = await equipmentApi.updateEquipment(id, values)
    setEquipment((current) => current.map((item) => (item._id === id ? updated : item)))
    return updated
  }, [])

  const removeEquipment = useCallback(async (id: string) => {
    await equipmentApi.deleteEquipment(id)
    setEquipment((current) => current.filter((item) => item._id !== id))
  }, [])

  return { equipment, isLoading, loadError, reload, addEquipment, changeEquipment, removeEquipment }
}
