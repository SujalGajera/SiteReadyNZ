// src/services/equipmentService.ts — Business rules for equipment records.
// Controllers call these functions and only handle HTTP. Phase 7 will put a repository
// behind this file so the rules here never need to know about Mongoose.

import Equipment, { IEquipment, EquipmentType } from '../models/Equipment';
import { AppError } from '../middleware/errorHandler';

/** The fields a client is allowed to send. `status` and `_id` are deliberately missing. */
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
export async function listEquipment(): Promise<IEquipment[]> {
  return Equipment.find().populate('assignedManagerId', 'name').sort({ expiryDate: 1 });
}

export async function getEquipment(id: string): Promise<IEquipment> {
  const equipment = await Equipment.findById(id).populate('assignedManagerId', 'name');
  if (!equipment) throw httpError(404, 'Equipment not found.');
  return equipment;
}

export async function createEquipment(input: EquipmentInput, managerId: string): Promise<IEquipment> {
  // The manager who adds an item is recorded as its owner
  return Equipment.create({ ...pickWritableFields(input), assignedManagerId: managerId });
}

/**
 * Uses find + save (not findByIdAndUpdate) so the pre-save hook runs and the
 * status is recalculated from the new expiry date.
 */
export async function updateEquipment(id: string, input: Partial<EquipmentInput>): Promise<IEquipment> {
  const equipment = await Equipment.findById(id);
  if (!equipment) throw httpError(404, 'Equipment not found.');

  equipment.set(pickWritableFields(input));
  return equipment.save();
}

export async function deleteEquipment(id: string): Promise<void> {
  const equipment = await Equipment.findById(id);
  if (!equipment) throw httpError(404, 'Equipment not found.');
  await equipment.deleteOne();
}
