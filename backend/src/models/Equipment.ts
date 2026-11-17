// src/models/Equipment.ts — Mongoose model for safety equipment items
// Each piece of equipment has an expiry date and a status derived from it, so managers
// always see current risk levels.

import mongoose, { Document, Schema, Types } from 'mongoose';
import { calculateEquipmentStatus } from '../utils/statusCalculator';

// All valid equipment types used in NZ workplace safety contexts
export const EQUIPMENT_TYPES = ['fire_extinguisher', 'first_aid', 'aed', 'safety_sign', 'other'] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

// Status is derived from the expiry date. It is never set by API callers.
export type EquipmentStatus = 'ok' | 'due_soon' | 'overdue' | 'expired';

export interface IEquipment extends Document {
  name: string;
  type: EquipmentType;
  location: string;
  serialNumber?: string;
  purchaseDate?: Date;
  expiryDate: Date;
  status: EquipmentStatus; // Saved for querying and notifications; responses always recalculate it
  assignedManagerId?: Types.ObjectId;
  lastInspectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    name: { type: String, required: [true, 'Equipment name is required'], trim: true, maxlength: 120 },
    type: { type: String, enum: EQUIPMENT_TYPES, required: [true, 'Equipment type is required'] },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 160 },
    // Unique when present. `sparse` lets many items have no serial number at all.
    serialNumber: { type: String, trim: true, maxlength: 80, unique: true, sparse: true },
    purchaseDate: { type: Date },
    expiryDate: { type: Date, required: [true, 'Expiry date is required'] },
    status: { type: String, enum: ['ok', 'due_soon', 'overdue', 'expired'], default: 'ok' },
    assignedManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    lastInspectedAt: { type: Date },
  },
  { timestamps: true }
);

// Runs before every save() so the stored status follows the expiry date.
equipmentSchema.pre('save', function (next) {
  this.status = calculateEquipmentStatus(this.expiryDate);
  next();
});

// A stored status goes stale the moment midnight passes (an item saved as "ok" in October
// is "expired" in December even though nobody saved it again). So every response
// recalculates the status from the expiry date instead of trusting the stored value.
equipmentSchema.set('toJSON', {
  transform(_doc, ret) {
    const plainEquipment = ret as unknown as Record<string, unknown>;
    delete plainEquipment.__v;
    plainEquipment.status = calculateEquipmentStatus(new Date(plainEquipment.expiryDate as Date));
    return plainEquipment;
  },
});

const Equipment = mongoose.model<IEquipment>('Equipment', equipmentSchema);

export default Equipment;
