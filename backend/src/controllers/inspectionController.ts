// src/controllers/inspectionController.ts — HTTP handlers for inspections.
// Read the request, call inspectionService, send the response.

import { Request, Response, NextFunction } from 'express';
import { rejectIfInvalid } from '../utils/validation';
import * as inspectionService from '../services/inspectionService';
import type { AssignInput, Caller, SubmitInput } from '../services/inspectionService';

/** Who is calling, from the verified token */
function callerOf(req: Request): Caller {
  const { id, role, orgId } = req.user!;
  return { id, role, orgId };
}

/** GET /api/inspections — every inspection in the workspace (manager, 200) */
export async function getAllInspections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await inspectionService.listInspections(req.user!.orgId));
  } catch (error) {
    next(error);
  }
}

/** GET /api/inspections/assigned/:userId — one person's list (200), or 403 if a staff member asks for someone else's */
export async function getAssignedInspections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    res.status(200).json(await inspectionService.listAssignedTo(req.params.userId, callerOf(req)));
  } catch (error) {
    next(error);
  }
}

/** POST /api/inspections — assign an inspection to a staff member (manager, 201) */
export async function createInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    const { equipmentId, assignedStaffId, scheduledDate } = req.body as AssignInput;
    res.status(201).json(await inspectionService.assignInspection({ equipmentId, assignedStaffId, scheduledDate }, callerOf(req)));
  } catch (error) {
    next(error);
  }
}

/** POST /api/inspections/submit — save a finished checklist (200). Repeating the same upload is safe. */
export async function submitInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    const { inspectionId, submissionId, completedAt, items } = req.body as SubmitInput;
    res.status(200).json(await inspectionService.submitInspection({ inspectionId, submissionId, completedAt, items }, callerOf(req)));
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/inspections/:id — delete an inspection that has not been done yet (manager, 204) */
export async function deleteInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    await inspectionService.deleteInspection(req.params.id, callerOf(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/inspections/:id/sync — mark a finished inspection as uploaded (200) */
export async function syncInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    res.status(200).json(await inspectionService.markSynced(req.params.id, callerOf(req)));
  } catch (error) {
    next(error);
  }
}
