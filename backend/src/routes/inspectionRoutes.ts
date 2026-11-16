// src/routes/inspectionRoutes.ts — Route definitions for inspection endpoints
// All routes require authentication. The /submit route is used for both online
// submission and sync of offline-completed inspections.

import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuthentication } from '../middleware/authMiddleware';
import {
  getAllInspections,
  getAssignedInspections,
  createInspection,
  submitInspection,
  syncInspection,
} from '../controllers/inspectionController';

const inspectionRouter = Router();

// All inspection routes require a logged-in user (manager or staff)
inspectionRouter.use(requireAuthentication);

// Managers view all inspections for oversight; staff only need their own (see /assigned)
inspectionRouter.get('/', getAllInspections);

// Staff call this on login to load their personal task list
inspectionRouter.get('/assigned/:userId', getAssignedInspections);

// Managers create inspection assignments for staff members
inspectionRouter.post(
  '/',
  [
    body('equipmentId').notEmpty().withMessage('Equipment ID is required'),
    body('assignedStaffId').notEmpty().withMessage('Assigned staff ID is required'),
    body('scheduledDate')
      .isISO8601()
      .withMessage('Scheduled date must be a valid date'),
  ],
  createInspection
);

// Staff submit their completed checklist (also used by the offline sync flow)
inspectionRouter.post(
  '/submit',
  [
    body('inspectionId').notEmpty().withMessage('Inspection ID is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items must be a non-empty array'),
  ],
  submitInspection
);

// Background Sync calls this to mark an inspection as synced after reconnecting
inspectionRouter.patch('/:id/sync', syncInspection);

export default inspectionRouter;
