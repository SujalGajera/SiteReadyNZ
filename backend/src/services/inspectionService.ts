// src/services/inspectionService.ts — Business rules for inspections.
// Every function is limited to the caller's workspace (`organisationId`).
// Stored data is read and written through the repositories (Repository pattern), so this file
// holds only the rules: who may do what, what counts as a complete checklist, and so on.

import type { IInspection, IInspectionItem } from '../models/Inspection';
import { inspectionRepository } from '../repositories/inspectionRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { userRepository } from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';
import { buildChecklist } from '../utils/checklistTemplates';

function httpError(statusCode: number, message: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/** Who is calling: taken from the verified login token, never from the request body */
export interface Caller {
  id: string;
  role: string;
  orgId: string;
}

export interface AssignInput {
  equipmentId: string;
  assignedStaffId: string;
  scheduledDate: string;
}

/** What the phone sends when a checklist is finished */
export interface SubmitInput {
  inspectionId: string;
  submissionId: string;
  completedAt?: string;
  items: { itemId: string; result: string; notes?: string }[];
}

const ANSWERS = ['pass', 'fail', 'flag'];

/** Everything in the workspace, soonest due first. For managers. */
export async function listInspections(organisationId: string): Promise<IInspection[]> {
  return inspectionRepository.listByOrganisation(organisationId);
}

/** One person's list. A staff member can only ask for their own; a manager can ask for anyone's in the workspace. */
export async function listAssignedTo(staffId: string, caller: Caller): Promise<IInspection[]> {
  if (caller.role === 'staff' && caller.id !== staffId) {
    throw httpError(403, 'You can only see your own inspections.');
  }
  return inspectionRepository.listForStaff(caller.orgId, staffId);
}

/** A manager assigns one piece of equipment to one staff member for a given day */
export async function assignInspection(input: AssignInput, caller: Caller): Promise<IInspection> {
  const equipment = await equipmentRepository.findInOrganisation(input.equipmentId, caller.orgId);
  if (!equipment) throw httpError(404, 'Equipment not found.');

  const staff = await userRepository.findStaffInOrganisation(input.assignedStaffId, caller.orgId);
  if (!staff) throw httpError(404, 'Staff member not found.');

  return inspectionRepository.createAndPopulate({
    organisationId: caller.orgId,
    equipmentId: equipment._id,
    assignedStaffId: staff._id,
    assignedById: caller.id,
    scheduledDate: input.scheduledDate,
    items: buildChecklist(equipment.type), // The questions for this kind of equipment
  });
}

/** Use the phone's finish time if it is sensible (not in the future, not before the task existed) */
function chooseCompletedAt(claimed: string | undefined, createdAt: Date): Date {
  const now = new Date();
  if (!claimed) return now;
  const parsed = new Date(claimed);
  const fiveMinutes = 5 * 60 * 1000;
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() > now.getTime() + fiveMinutes || parsed < createdAt) return now;
  return parsed;
}

/**
 * Saves a finished checklist. Safe to call twice with the same `submissionId`: a phone that lost
 * its connection halfway through an upload will retry, and the retry must not fail or double-count.
 */
export async function submitInspection(input: SubmitInput, caller: Caller): Promise<IInspection> {
  const inspection = await inspectionRepository.findInOrganisation(input.inspectionId, caller.orgId);
  if (!inspection) throw httpError(404, 'Inspection not found.');

  if (caller.role === 'staff' && String(inspection.assignedStaffId) !== caller.id) {
    throw httpError(403, 'This inspection is assigned to someone else.');
  }

  if (inspection.status === 'completed') {
    // Same upload arriving again: report success without changing anything
    if (inspection.submissionId && inspection.submissionId === input.submissionId) return inspection;
    throw httpError(409, 'This inspection has already been completed.');
  }

  // Every question must be answered, and only questions that exist on this inspection are accepted
  const answers = new Map(input.items.map((item) => [item.itemId, item]));
  const checkedItems: IInspectionItem[] = inspection.items.map((question) => {
    const answer = answers.get(question.itemId);
    if (!answer || !ANSWERS.includes(answer.result)) {
      throw httpError(400, `Answer every item before submitting. Missing: ${question.description}`);
    }
    const notes = (answer.notes ?? '').trim();
    if (answer.result !== 'pass' && !notes) {
      throw httpError(400, `Add a note for "${question.description}" (needed for Fail and Flag).`);
    }
    // Wording and severity come from the stored question, never from the phone
    return {
      itemId: question.itemId,
      description: question.description,
      category: question.category,
      severity: question.severity,
      result: answer.result as IInspectionItem['result'],
      notes,
    };
  });

  const completedAt = chooseCompletedAt(input.completedAt, inspection.createdAt);
  inspection.set({ items: checkedItems, completedAt, status: 'completed', syncStatus: 'synced', submissionId: input.submissionId });
  const saved = await inspectionRepository.save(inspection);

  // Recording the check is what clears a "check overdue" status on the equipment
  const equipment = await equipmentRepository.findInOrganisation(String(inspection.equipmentId), caller.orgId);
  if (equipment && (!equipment.lastInspectedAt || equipment.lastInspectedAt < completedAt)) {
    equipment.lastInspectedAt = completedAt;
    await equipmentRepository.save(equipment);
  }
  return saved;
}

/** Marks a finished inspection as uploaded. Used by Background Sync once its upload succeeds. */
export async function markSynced(id: string, caller: Caller): Promise<IInspection> {
  const inspection = await inspectionRepository.findInOrganisation(id, caller.orgId);
  if (!inspection) throw httpError(404, 'Inspection not found.');
  if (caller.role === 'staff' && String(inspection.assignedStaffId) !== caller.id) {
    throw httpError(403, 'This inspection is assigned to someone else.');
  }
  if (inspection.status !== 'completed') throw httpError(409, 'Only a completed inspection can be marked as synced.');

  inspection.syncStatus = 'synced';
  return inspectionRepository.save(inspection);
}
