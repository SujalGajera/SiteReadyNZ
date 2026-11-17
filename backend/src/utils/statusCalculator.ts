// src/utils/statusCalculator.ts — Works out an equipment item's status.
//
// The rules follow how workplace safety equipment is normally tracked (in NZ this is
// guided by NZS 4503 for extinguishers and AS/NZS 1851 for servicing):
//   expired   the equipment itself is past its expiry date and must be replaced
//   overdue   it has not expired, but its routine check is late
//   due_soon  it expires within the warning window (30 days), so order a replacement
//   ok        everything is in date and checked
// "Expired" outranks "overdue", which outranks "due soon".
//
// Strategy Pattern: the rule is a plain function that receives two numbers and returns a
// status. A different rule (say a 60-day warning window) is just another function passed
// in, and tests can pass a fake one. Nothing else in the app has to change.

import type { EquipmentStatus, EquipmentType } from '../models/Equipment';

/** The two measurements every strategy decides from */
export interface StatusMetrics {
  /** Whole calendar days until the expiry date. Negative means it has passed. */
  daysUntilExpiry: number;
  /** Days until the next routine check is due. Negative means the check is late. */
  daysUntilInspectionDue: number;
}

export type StatusStrategy = (metrics: StatusMetrics) => EquipmentStatus;

/** How many days before expiry an item starts showing as "due soon" */
export const DUE_SOON_WINDOW_DAYS = 30;

/**
 * How often each kind of item needs a routine visual check. Monthly checks for the
 * items people rely on in an emergency; less often for signs.
 */
export const INSPECTION_INTERVAL_DAYS: Record<EquipmentType, number> = {
  fire_extinguisher: 30,
  first_aid: 30,
  aed: 30,
  safety_sign: 90,
  other: 90,
};

/** The default rule used by the app */
export const standardStatusStrategy: StatusStrategy = ({ daysUntilExpiry, daysUntilInspectionDue }) => {
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilInspectionDue < 0) return 'overdue';
  if (daysUntilExpiry <= DUE_SOON_WINDOW_DAYS) return 'due_soon';
  return 'ok';
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** What the calculator needs to know about an item */
export interface StatusInput {
  type: EquipmentType;
  expiryDate: Date;
  /** When it was last checked. If it has never been checked, its creation date is used. */
  lastInspectedAt?: Date | null;
  createdAt?: Date | null;
}

/**
 * Whole calendar days from today to the expiry date.
 * Expiry dates come from the date picker as "2026-12-01", which JavaScript stores as
 * midnight UTC. Reading the UTC parts gives back the calendar date the manager picked,
 * whatever time zone the server runs in. "Today" uses the server's local date.
 */
export function daysUntilExpiry(expiryDate: Date, now: Date = new Date()): number {
  const expiryDay = Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiryDay - today) / MS_PER_DAY);
}

/** Days until the next routine check, counted from the last check (or from creation) */
export function daysUntilInspectionDue(input: StatusInput, now: Date = new Date()): number {
  const lastCheck = input.lastInspectedAt ?? input.createdAt ?? now;
  const daysSinceCheck = Math.floor((now.getTime() - new Date(lastCheck).getTime()) / MS_PER_DAY);
  return INSPECTION_INTERVAL_DAYS[input.type] - daysSinceCheck;
}

export function calculateEquipmentStatus(
  input: StatusInput,
  strategy: StatusStrategy = standardStatusStrategy,
  now: Date = new Date()
): EquipmentStatus {
  return strategy({
    daysUntilExpiry: daysUntilExpiry(input.expiryDate, now),
    daysUntilInspectionDue: daysUntilInspectionDue(input, now),
  });
}
