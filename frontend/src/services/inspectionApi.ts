import { api } from '@/services/api'
import type { AssignInspectionValues, Inspection } from '@/types'

/** One staff member's own task list */
export async function fetchAssignedInspections(userId: string): Promise<Inspection[]> {
  const response = await api.get<Inspection[]>(`/api/inspections/assigned/${userId}`)
  return response.data
}

/** Every inspection in the workspace (managers) */
export async function fetchAllInspections(): Promise<Inspection[]> {
  const response = await api.get<Inspection[]>('/api/inspections')
  return response.data
}

/** A manager gives a piece of equipment to a staff member for a day */
export async function assignInspection(values: AssignInspectionValues): Promise<Inspection> {
  const response = await api.post<Inspection>('/api/inspections', values)
  return response.data
}
