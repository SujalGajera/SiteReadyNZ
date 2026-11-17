// src/controllers/staffController.ts — HTTP handlers for the manager's staff list.

import { Request, Response, NextFunction } from 'express';
import { rejectIfInvalid } from '../utils/validation';
import * as staffService from '../services/staffService';
import type { RegisterInput } from '../services/authService';

/** GET /api/staff — every staff account (200) */
export async function getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await staffService.listStaff(req.user!.orgId));
  } catch (error) {
    next(error);
  }
}

/** POST /api/staff — create a staff account (201) or 409 if the email is taken */
export async function addStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;
    const { name, email, password } = req.body as RegisterInput;
    res.status(201).json(await staffService.createStaff({ name, email, password }, req.user!.orgId));
  } catch (error) {
    next(error);
  }
}
