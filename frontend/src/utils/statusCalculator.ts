import type { EquipmentStatus, EquipmentType } from '@/types'
import { daysUntil } from '@/utils/dateHelpers'

// Strategy Pattern (same idea and same rule as backend/src/utils/statusCalculator.ts).
// The server already sends a status. We recalculate on the device so that data cached while
// offline is shown with today's status, not the status it had when it was saved.
//
//   expired   the equipment is past its expiry date and must be replaced
//   overdue   not expired, but its routine check is late
//   due_soon  expires within 30 days
//   ok        in date and checked

export interface StatusMetrics {
  daysUntilExpiry: number
  daysUntilInspectionDue: number
}

export type StatusStrategy = (metrics: StatusMetrics) => EquipmentStatus

export const DUE_SOON_WINDOW_DAYS = 30

/** Days between routine checks for each kind of item */
export const INSPECTION_INTERVAL_DAYS: Record<EquipmentType, number> = {
  fire_extinguisher: 30,
  first_aid: 30,
  aed: 30,
  safety_sign: 90,
  other: 90,
}

export const standardStatusStrategy: StatusStrategy = ({ daysUntilExpiry, daysUntilInspectionDue }) => {
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilInspectionDue < 0) return 'overdue'
  if (daysUntilExpiry <= DUE_SOON_WINDOW_DAYS) return 'due_soon'
  return 'ok'
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface StatusInput {
  type: EquipmentType
  expiryDate: string
  lastInspectedAt?: string
  createdAt?: string
}

/** Days until the next routine check, counted from the last check (or from when the item was added) */
export function daysUntilInspectionDue(input: StatusInput, now: Date = new Date()): number {
  const lastCheck = input.lastInspectedAt ?? input.createdAt ?? now.toISOString()
  const daysSinceCheck = Math.floor((now.getTime() - new Date(lastCheck).getTime()) / MS_PER_DAY)
  return INSPECTION_INTERVAL_DAYS[input.type] - daysSinceCheck
}

export function calculateEquipmentStatus(
  input: StatusInput,
  strategy: StatusStrategy = standardStatusStrategy,
  now: Date = new Date()
): EquipmentStatus {
  return strategy({
    daysUntilExpiry: daysUntil(input.expiryDate, now),
    daysUntilInspectionDue: daysUntilInspectionDue(input, now),
  })
}

/** Labels, and the order statuses are sorted in (0 = most urgent) */
export const statusDisplay: Record<EquipmentStatus, { label: string; severity: number; meaning: string }> = {
  expired: { label: 'Expired', severity: 0, meaning: 'Past its expiry date. Replace it.' },
  overdue: { label: 'Check overdue', severity: 1, meaning: 'Not expired, but its routine check is late.' },
  due_soon: { label: 'Due soon', severity: 2, meaning: 'Expires within 30 days.' },
  ok: { label: 'Ready', severity: 3, meaning: 'In date and checked.' },
}

export const equipmentTypeLabels: Record<EquipmentType, string> = {
  fire_extinguisher: 'Fire extinguisher',
  first_aid: 'First aid kit',
  aed: 'AED',
  safety_sign: 'Safety sign',
  other: 'Other',
}

/** Short codes used on the small type tile in the equipment list */
export const equipmentTypeCodes: Record<EquipmentType, string> = {
  fire_extinguisher: 'FE',
  first_aid: 'FA',
  aed: 'AED',
  safety_sign: 'SGN',
  other: 'OTH',
}
