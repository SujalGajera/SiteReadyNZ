// src/models/Equipment.ts — Mongoose model for safety equipment items
// Each piece of equipment belongs to a site, has an expiry date, and an
// automatically computed status so managers always see current risk levels.

import mongoose, { Document, Schema, Types } from 'mongoose';

// All valid equipment types used in NZ workplace safety contexts
export type EquipmentType =
  | 'fire_extinguisher'
  | 'first_aid'
  | 'aed'
  | 'safety_sign'
  | 'other';

// Status is derived from the expiry date — it is never set manually
export type EquipmentStatus = 'ok' | 'due_soon' | 'overdue' | 'expired';

export interface IEquipment extends Document {
  name: string;
  type: EquipmentType;
  location: string;
  serialNumber?: string;
  purchaseDate?: Date;
  expiryDate: Date;
  status: EquipmentStatus; // Computed by pre-save hook — do not set manually
  assignedManagerId?: Types.ObjectId;
  lastInspectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['fire_extinguisher', 'first_aid', 'aed', 'safety_sign', 'other'],
      required: [true, 'Equipment type is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    purchaseDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    status: {
      type: String,
      enum: ['ok', 'due_soon', 'overdue', 'expired'],
      default: 'ok',
    },
    assignedManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Links to the User model so we can populate manager details
    },
    lastInspectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook — runs before every save() call to keep status in sync with expiryDate.
// Centralising this calculation here means it is impossible for the status to be stale
// after any update, regardless of which part of the code triggered the save.
equipmentSchema.pre('save', function (next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates without time-of-day noise

  const expiry = new Date(this.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  // How many full days remain until expiry (negative means already past)
  const daysUntilExpiry = Math.floor(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    this.status = 'expired'; // Expiry date is in the past
  } else if (daysUntilExpiry === 0) {
    this.status = 'overdue'; // Expires today — treat as overdue for immediate action
  } else if (daysUntilExpiry <= 30) {
    this.status = 'due_soon'; // Within the 30-day warning window
  } else {
    this.status = 'ok'; // Plenty of time remaining
  }

  next();
});

const Equipment = mongoose.model<IEquipment>('Equipment', equipmentSchema);

export default Equipment;
