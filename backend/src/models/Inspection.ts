// src/models/Inspection.ts — Mongoose model for equipment inspection records
// An inspection is a checklist assigned to a staff member for a specific piece
// of equipment. It can be completed offline and synced later.

import mongoose, { Document, Schema, Types } from 'mongoose';

// Each item on the inspection checklist records what was checked and the outcome
export interface IInspectionItem {
  itemId: string;        // Client-generated ID so offline items can be referenced
  description: string;   // Human-readable description of what was checked
  category: string;      // Logical grouping (e.g. "Physical Condition", "Labels")
  result: 'pass' | 'fail' | 'flag' | 'not_checked';
  notes?: string;        // Inspector's free-text notes for this item
  severity: 'low' | 'medium' | 'critical'; // How serious a failure at this item would be
}

export interface IInspection extends Document {
  equipmentId: Types.ObjectId;    // Which piece of equipment is being inspected
  assignedStaffId: Types.ObjectId; // Which staff member is responsible
  scheduledDate: Date;
  completedAt?: Date;             // Null until the inspection is submitted
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  syncStatus: 'synced' | 'pending_sync' | 'failed'; // Tracks whether offline data has been uploaded
  items: IInspectionItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schema for individual checklist items — embedded in the inspection document
// rather than a separate collection because they have no independent lifecycle
const inspectionItemSchema = new Schema<IInspectionItem>(
  {
    itemId: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    result: {
      type: String,
      enum: ['pass', 'fail', 'flag', 'not_checked'],
      default: 'not_checked',
    },
    notes: { type: String },
    severity: {
      type: String,
      enum: ['low', 'medium', 'critical'],
      required: true,
    },
  },
  { _id: false } // No separate _id for sub-documents — itemId serves that purpose
);

const inspectionSchema = new Schema<IInspection>(
  {
    equipmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment ID is required'],
    },
    assignedStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned staff ID is required'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    completedAt: {
      type: Date,
      default: null, // Null until the inspection is submitted as complete
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending',
    },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending_sync', 'failed'],
      default: 'synced', // New server-created inspections are already in sync
    },
    items: {
      type: [inspectionItemSchema],
      default: [], // Start with an empty checklist; items are added when the inspection is submitted
    },
  },
  {
    timestamps: true,
  }
);

const Inspection = mongoose.model<IInspection>('Inspection', inspectionSchema);

export default Inspection;
