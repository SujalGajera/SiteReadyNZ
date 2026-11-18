// src/models/Equipment.ts — Mongoose model for safety equipment items
// Each piece of equipment has an expiry date and a status derived from it, so managers
// always see current risk levels.

import mongoose, { Document, Schema, Types } from 'mongoose';
import { calculateEquipmentStatus, StatusInput } from '../utils/statusCalculator';

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
  organisationId: Types.ObjectId; // The workspace this item belongs to
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
    // Unique within one workspace (see the index below), so two businesses can use the same number
    serialNumber: { type: String, trim: true, maxlength: 80 },
    purchaseDate: { type: Date },
    expiryDate: { type: Date, required: [true, 'Expiry date is required'] },
    status: { type: String, enum: ['ok', 'due_soon', 'overdue', 'expired'], default: 'ok' },
    organisationId: { type: Schema.Types.ObjectId, required: true, index: true },
    assignedManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    lastInspectedAt: { type: Date },
  },
  { timestamps: true }
);

// Serial numbers must be unique inside a workspace. The partial filter means items with no serial number never clash.
equipmentSchema.index(
  { organisationId: 1, serialNumber: 1 },
  { unique: true, partialFilterExpression: { serialNumber: { $type: 'string' } } }
);

// Runs before every save() so the stored status follows the expiry date.
equipmentSchema.pre('save', function (next) {
  this.status = calculateEquipmentStatus(this);
  next();
});

// A stored status goes stale as days pass (an item saved as "ok" in October is "expired" in
// December even though nobody saved it again). So every response recalculates the status
// instead of trusting the stored value.
equipmentSchema.set('toJSON', {
  transform(_doc, ret) {
    const plainEquipment = ret as unknown as Record<string, unknown>;
    delete plainEquipment.__v;
    // Partial copies (an inspection only asks for the name, type and location) have no expiry date,
    // so there is nothing to calculate for them
    if (plainEquipment.expiryDate) {
      plainEquipment.status = calculateEquipmentStatus(plainEquipment as unknown as StatusInput);
    }
    return plainEquipment;
  },
});

const Equipment = mongoose.model<IEquipment>('Equipment', equipmentSchema);

export default Equipment;
