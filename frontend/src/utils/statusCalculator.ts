import type { EquipmentStatus } from '@/types'
import { daysUntil } from '@/utils/dateHelpers'

// Strategy Pattern (same idea as the backend): the rule is a swappable function.
// The server already sends a status, but we recalculate on the device so data that was
// cached while offline is still shown with today's status, not the status it had when it was saved.
// The rule must match backend/src/utils/statusCalculator.ts.

export type StatusStrategy = (daysUntilExpiry: number) => EquipmentStatus

export const DUE_SOON_WINDOW_DAYS = 30

export const standardStatusStrategy: StatusStrategy = (daysUntilExpiry) => {
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry === 0) return 'overdue'
  if (daysUntilExpiry <= DUE_SOON_WINDOW_DAYS) return 'due_soon'
  return 'ok'
}

export function calculateEquipmentStatus(
  expiryDate: string,
  strategy: StatusStrategy = standardStatusStrategy,
  now: Date = new Date()
): EquipmentStatus {
  return strategy(daysUntil(expiryDate, now))
}

/** How each status is shown. Order is also the sort order, most urgent first. */
export const statusDisplay: Record<EquipmentStatus, { label: string; severity: number }> = {
  expired: { label: 'Expired', severity: 0 },
  overdue: { label: 'Overdue', severity: 1 },
  due_soon: { label: 'Due soon', severity: 2 },
  ok: { label: 'OK', severity: 3 },
}

export const equipmentTypeLabels = {
  fire_extinguisher: 'Fire extinguisher',
  first_aid: 'First aid kit',
  aed: 'AED',
  safety_sign: 'Safety sign',
  other: 'Other',
} as const
