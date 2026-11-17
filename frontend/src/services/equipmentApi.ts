import { api } from '@/services/api'
import { calculateEquipmentStatus } from '@/utils/statusCalculator'
import type { Equipment, EquipmentFormValues } from '@/types'

/**
 * Re-checks the status against today's date. The server sends one too, but answers cached
 * by the service worker while offline can be days old, and an item may have expired since.
 */
function withCurrentStatus(equipment: Equipment): Equipment {
  return { ...equipment, status: calculateEquipmentStatus(equipment) }
}

export async function fetchEquipment(): Promise<Equipment[]> {
  const response = await api.get<Equipment[]>('/api/equipment')
  return response.data.map(withCurrentStatus)
}

export async function fetchEquipmentById(id: string): Promise<Equipment> {
  const response = await api.get<Equipment>(`/api/equipment/${id}`)
  return withCurrentStatus(response.data)
}

export async function createEquipment(values: EquipmentFormValues): Promise<Equipment> {
  const response = await api.post<Equipment>('/api/equipment', values)
  return withCurrentStatus(response.data)
}

export async function updateEquipment(id: string, values: EquipmentFormValues): Promise<Equipment> {
  const response = await api.put<Equipment>(`/api/equipment/${id}`, values)
  return withCurrentStatus(response.data)
}

export async function deleteEquipment(id: string): Promise<void> {
  await api.delete(`/api/equipment/${id}`)
}
