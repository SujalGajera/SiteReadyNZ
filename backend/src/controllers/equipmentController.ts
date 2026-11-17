// src/controllers/equipmentController.ts — HTTP handlers for equipment.
// Each function maps to one endpoint: read the request, call equipmentService, send the response.

import { Request, Response, NextFunction } from 'express';
import { rejectIfInvalid } from '../utils/validation';
import * as equipmentService from '../services/equipmentService';
import type { EquipmentInput } from '../services/equipmentService';

/** GET /api/equipment — everything, soonest expiry first (200) */
export async function getAllEquipment(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await equipmentService.listEquipment());
  } catch (error) {
    next(error);
  }
}

/** GET /api/equipment/:id — one item (200) or 404 */
export async function getEquipmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    res.status(200).json(await equipmentService.getEquipment(req.params.id));
  } catch (error) {
    next(error);
  }
}

/** POST /api/equipment — create an item (201). Status is calculated from the expiry date. */
export async function createEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    const created = await equipmentService.createEquipment(req.body as EquipmentInput, req.user!.id);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

/** PUT /api/equipment/:id — change an item (200) or 404 */
export async function updateEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    const updated = await equipmentService.updateEquipment(req.params.id, req.body as Partial<EquipmentInput>);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/equipment/:id — remove an item (204, no body) or 404 */
export async function deleteEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    await equipmentService.deleteEquipment(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
