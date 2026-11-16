// src/controllers/inspectionController.ts — Handles all inspection-related HTTP requests
// Manages creating, retrieving, submitting, and syncing inspection records.
// Offline sync support is handled via the syncStatus and completedAt fields.

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Inspection from '../models/Inspection';

/**
 * GET /api/inspections
 * Returns all inspections with equipment name and assigned staff name populated.
 * Managers use this to get an overview of all inspection activity.
 */
export async function getAllInspections(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const inspections = await Inspection.find()
      .populate('equipmentId', 'name type location') // Include enough equipment info to display in the list
      .populate('assignedStaffId', 'name email')      // Include staff contact info for manager reference
      .sort({ scheduledDate: 1 });                    // Soonest due first

    res.status(200).json(inspections);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/inspections/assigned/:userId
 * Returns only the inspections assigned to a specific staff member.
 * Staff members call this on login to load their personal task list.
 */
export async function getAssignedInspections(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;

    const assignedInspections = await Inspection.find({
      assignedStaffId: userId,
    })
      .populate('equipmentId', 'name type location')
      .sort({ scheduledDate: 1 });

    res.status(200).json(assignedInspections);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/inspections
 * Creates a new inspection assignment. The inspection starts with status 'pending'
 * and an empty items array — items are filled in when the staff member submits.
 */
export async function createInspection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ errors: validationErrors.array() });
      return;
    }

    const newInspection = await Inspection.create({
      ...req.body,
      status: 'pending',   // Always starts pending — staff cannot create pre-completed inspections
      syncStatus: 'synced', // Created server-side so it is immediately in sync
    });

    res.status(201).json(newInspection);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/inspections/submit
 * Called when a staff member finishes an inspection (online or after coming back online).
 * Updates the checklist items, marks the inspection complete, and sets syncStatus to synced.
 */
export async function submitInspection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ errors: validationErrors.array() });
      return;
    }

    const { inspectionId, items } = req.body as {
      inspectionId: string;
      items: unknown[];
    };

    const inspection = await Inspection.findById(inspectionId);

    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found.' });
      return;
    }

    // Store the completed checklist items submitted by the staff member
    inspection.items = items as typeof inspection.items;
    inspection.completedAt = new Date(); // Record exactly when the inspection was finished
    inspection.status = 'completed';
    inspection.syncStatus = 'synced'; // Now that it has reached the server, it is in sync

    const submittedInspection = await inspection.save();

    res.status(200).json(submittedInspection);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/inspections/:id/sync
 * Called by the service worker's Background Sync when the device reconnects.
 * Marks an inspection as synced without requiring the full inspection data.
 */
export async function syncInspection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found.' });
      return;
    }

    // Mark the record as synced — it reached the server successfully
    inspection.syncStatus = 'synced';

    // If the inspection was completed offline and completedAt was not set yet, record now
    if (!inspection.completedAt && inspection.status === 'completed') {
      inspection.completedAt = new Date();
    }

    const syncedInspection = await inspection.save();

    res.status(200).json(syncedInspection);
  } catch (error) {
    next(error);
  }
}
