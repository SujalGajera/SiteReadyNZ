// src/utils/statusCalculator.ts — Works out an equipment item's status from its expiry date.
//
// Strategy Pattern: the rule for "what status is this?" is a plain function that can be
// swapped for another one without touching the model, controller or UI. `calculateEquipmentStatus`
// takes the strategy as an optional argument, so a stricter rule (say a 60-day warning window)
// is just a new function passed in, and tests can pass in a fake one.

import type { EquipmentStatus } from '../models/Equipment';

/** A strategy receives "whole days until expiry" (negative = already past) and returns a status */
export type StatusStrategy = (daysUntilExpiry: number) => EquipmentStatus;

/** How many days before expiry an item starts showing as "due soon" */
export const DUE_SOON_WINDOW_DAYS = 30;

/** The default rule used by the app */
export const standardStatusStrategy: StatusStrategy = (daysUntilExpiry) => {
  if (daysUntilExpiry < 0) return 'expired'; // The date has passed
  if (daysUntilExpiry === 0) return 'overdue'; // Expires today: needs action now
  if (daysUntilExpiry <= DUE_SOON_WINDOW_DAYS) return 'due_soon';
  return 'ok';
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole calendar days from `today` to the expiry date.
 *
 * Expiry dates arrive from the date picker as "2026-12-01", which JavaScript stores as
 * midnight UTC. Reading the UTC parts gives back exactly the calendar date the manager
 * picked, whatever time zone the server runs in. "Today" uses the server's local date.
 */
export function daysUntilExpiry(expiryDate: Date, now: Date = new Date()): number {
  const expiryDay = Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiryDay - today) / MS_PER_DAY);
}

export function calculateEquipmentStatus(
  expiryDate: Date,
  strategy: StatusStrategy = standardStatusStrategy,
  now: Date = new Date()
): EquipmentStatus {
  return strategy(daysUntilExpiry(expiryDate, now));
}
