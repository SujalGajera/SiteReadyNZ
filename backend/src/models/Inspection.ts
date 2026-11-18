// src/models/Inspection.ts — Mongoose model for inspection records.
// An inspection is a checklist assigned to a staff member for one piece of equipment.
// It can be completed offline on a phone and uploaded later.

import mongoose, { Document, Schema, Types } from 'mongoose';
import { daysUntilExpiry as daysUntilDate } from '../utils/statusCalculator';

export type InspectionResult = 'pass' | 'fail' | 'flag' | 'not_checked';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// One question on the checklist and the inspector's answer to it
export interface IInspectionItem {
  itemId: string;      // Stable id from the template, also used by the phone to match answers
  description: string;
  category: string;    // Heading the question is grouped under
  result: InspectionResult;
  notes?: string;      // Required when the answer is fail or flag
  severity: 'low' | 'medium' | 'critical'; // How serious a failed answer is
}

export interface IInspection extends Document {
  organisationId: Types.ObjectId;  // The workspace this inspection belongs to
  equipmentId: Types.ObjectId;
  assignedStaffId: Types.ObjectId;
  assignedById: Types.ObjectId;    // The manager who assigned it
  scheduledDate: Date;             // The day it is due (a calendar day, stored as midnight UTC)
  completedAt?: Date | null;       // When the checks were finished (on the phone, if done offline)
  status: InspectionStatus;
  syncStatus: 'synced' | 'pending_sync' | 'failed';
  /** Random id made by the phone for each completed checklist. Lets the server ignore a repeated upload. */
  submissionId?: string;
  items: IInspectionItem[];
  createdAt: Date;
  updatedAt: Date;
}

const inspectionItemSchema = new Schema<IInspectionItem>(
  {
    itemId: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    result: { type: String, enum: ['pass', 'fail', 'flag', 'not_checked'], default: 'not_checked' },
    notes: { type: String, maxlength: 500, default: '' },
    severity: { type: String, enum: ['low', 'medium', 'critical'], required: true },
  },
  { _id: false } // itemId already identifies each question
);

const inspectionSchema = new Schema<IInspection>(
  {
    organisationId: { type: Schema.Types.ObjectId, required: true, index: true },
    equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', required: [true, 'Equipment is required'] },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Staff member is required'], index: true },
    assignedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledDate: { type: Date, required: [true, 'Due date is required'] },
    completedAt: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'overdue'], default: 'pending' },
    syncStatus: { type: String, enum: ['synced', 'pending_sync', 'failed'], default: 'synced' },
    submissionId: { type: String, maxlength: 64 },
    items: { type: [inspectionItemSchema], default: [] },
  },
  { timestamps: true }
);

// Answers to "what is on my list" are always looked up by staff member and status
inspectionSchema.index({ organisationId: 1, assignedStaffId: 1, status: 1 });

// A task that is still open after its due day is shown as overdue. Like equipment status this is
// worked out when the answer is sent, so it can never be stale.
inspectionSchema.set('toJSON', {
  transform(_doc, ret) {
    const plainInspection = ret as unknown as Record<string, unknown>;
    delete plainInspection.__v;
    const isOpen = plainInspection.status === 'pending' || plainInspection.status === 'in_progress';
    if (isOpen && daysUntilDate(new Date(plainInspection.scheduledDate as Date)) < 0) {
      plainInspection.status = 'overdue';
    }
    return plainInspection;
  },
});

const Inspection = mongoose.model<IInspection>('Inspection', inspectionSchema);

export default Inspection;
