// src/services/equipmentService.ts — Business rules for equipment records.
// Every function takes the caller's workspace id (`organisationId`) and only ever touches
// that workspace's items, so one business can never read or change another's equipment.
// The database calls live in repositories/equipmentRepository.ts (Repository pattern), so the rules here never need to know about Mongoose.

import type { IEquipment, EquipmentType } from '../models/Equipment';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { AppError } from '../middleware/errorHandler';

/** The fields a client is allowed to send. `status`, `_id` and `organisationId` are deliberately missing. */
export interface EquipmentInput {
  name: string;
  type: EquipmentType;
  location: string;
  serialNumber?: string;
  purchaseDate?: string;
  expiryDate: string;
  lastInspectedAt?: string;
}

// The list of keys copied from a request body. Anything else is ignored.
const WRITABLE_FIELDS: (keyof EquipmentInput)[] = [
  'name',
  'type',
  'location',
  'serialNumber',
  'purchaseDate',
  'expiryDate',
  'lastInspectedAt',
];

function httpError(statusCode: number, message: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/** Keeps only whitelisted fields. A blank optional field becomes `undefined` so it is cleared, not stored as "". */
function pickWritableFields(input: Partial<EquipmentInput>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const field of WRITABLE_FIELDS) {
    if (input[field] === undefined) continue;
    picked[field] = input[field] === '' ? undefined : input[field];
  }
  return picked;
}

/** Soonest expiry first, so the most urgent items are at the top */
export async function listEquipment(organisationId: string): Promise<IEquipment[]> {
  return equipmentRepository.listByOrganisation(organisationId);
}

export async function getEquipment(id: string, organisationId: string): Promise<IEquipment> {
  const equipment = await equipmentRepository.findDetailed(id, organisationId);
  // An item in someone else's workspace looks exactly like one that does not exist
  if (!equipment) throw httpError(404, 'Equipment not found.');
  return equipment;
}

export async function createEquipment(input: EquipmentInput, managerId: string, organisationId: string): Promise<IEquipment> {
  // The manager who adds an item is recorded as its owner
  return equipmentRepository.create({ ...pickWritableFields(input), assignedManagerId: managerId, organisationId });
}

/**
 * Loads the item and saves it (not a one-step update) so the pre-save hook runs and the
 * status is recalculated from the new expiry date.
 */
export async function updateEquipment(id: string, organisationId: string, input: Partial<EquipmentInput>): Promise<IEquipment> {
  const equipment = await equipmentRepository.findInOrganisation(id, organisationId);
  if (!equipment) throw httpError(404, 'Equipment not found.');

  equipment.set(pickWritableFields(input));
  return equipmentRepository.save(equipment);
}

export async function deleteEquipment(id: string, organisationId: string): Promise<void> {
  const equipment = await equipmentRepository.findInOrganisation(id, organisationId);
  if (!equipment) throw httpError(404, 'Equipment not found.');
  await equipmentRepository.remove(equipment);
}