// src/controllers/equipmentController.ts — CRUD handlers for safety equipment
// Each function maps to exactly one HTTP endpoint. All DB interaction is through
// the Equipment model; status calculation is handled automatically by the pre-save hook.

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Equipment from '../models/Equipment';

/**
 * GET /api/equipment
 * Returns all equipment sorted by expiry date (soonest first) so managers
 * see the most urgent items at the top of the list.
 */
export async function getAllEquipment(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const allEquipment = await Equipment.find()
      .populate('assignedManagerId', 'name') // Bring in the manager's name without exposing their full document
      .sort({ expiryDate: 1 }); // Ascending — soonest to expire comes first

    res.status(200).json(allEquipment);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/equipment/:id
 * Returns a single equipment document or 404 if the ID does not exist.
 */
export async function getEquipmentById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const equipment = await Equipment.findById(req.params.id).populate(
      'assignedManagerId',
      'name'
    );

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found.' });
      return;
    }

    res.status(200).json(equipment);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/equipment
 * Creates a new equipment record. The pre-save hook automatically calculates
 * the initial status from the expiryDate.
 */
export async function createEquipment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Reject early if any validation rules in the route definition failed
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ errors: validationErrors.array() });
      return;
    }

    const newEquipment = await Equipment.create(req.body);

    // Status 201 — a new resource was created on the server
    res.status(201).json(newEquipment);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/equipment/:id
 * Updates an existing equipment record. We use save() instead of findByIdAndUpdate()
 * so that the pre-save hook runs and recalculates the status automatically.
 */
export async function updateEquipment(
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

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found.' });
      return;
    }

    // Apply only the fields that were sent in the request body
    const allowedFields = [
      'name',
      'type',
      'location',
      'serialNumber',
      'purchaseDate',
      'expiryDate',
      'assignedManagerId',
      'lastInspectedAt',
    ] as const;

    // Mongoose lets us set many fields at once; only whitelisted keys are copied so a
    // caller can never overwrite `status` or `_id` through the request body
    const changes: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
      }
    }
    equipment.set(changes);

    // save() triggers the pre-save hook that recalculates status from the new expiryDate
    const updatedEquipment = await equipment.save();

    res.status(200).json(updatedEquipment);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/equipment/:id
 * Removes the equipment record permanently.
 * Returns 204 No Content — DELETE responses intentionally have no body.
 */
export async function deleteEquipment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found.' });
      return;
    }

    await equipment.deleteOne();

    // 204 — resource deleted, no body returned
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
