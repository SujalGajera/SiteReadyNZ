import { api } from '@/services/api'
import type { User } from '@/types'

export interface NewStaffDetails {
  name: string
  email: string
  password: string
}

export async function fetchStaff(): Promise<User[]> {
  const response = await api.get<User[]>('/api/staff')
  return response.data
}

export async function createStaff(details: NewStaffDetails): Promise<User> {
  const response = await api.post<User>('/api/staff', details)
  return response.data
}
