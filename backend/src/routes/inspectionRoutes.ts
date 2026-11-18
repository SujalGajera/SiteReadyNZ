// src/routes/inspectionRoutes.ts — URLs for inspections.
// Managers assign and oversee. Staff list their own tasks and submit finished checklists.

import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuthentication } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import {
  getAllInspections,
  getAssignedInspections,
  createInspection,
  submitInspection,
  syncInspection,
} from '../controllers/inspectionController';

const inspectionRouter = Router();

// Every inspection route needs a signed-in user
inspectionRouter.use(requireAuthentication);

// Manager overview of everything in the workspace
inspectionRouter.get('/', requireRole('manager'), getAllInspections);

// A person's task list. The service stops staff asking for anyone but themselves.
inspectionRouter.get(
  '/assigned/:userId',
  param('userId').isMongoId().withMessage('Invalid user id'),
  getAssignedInspections
);

// A manager assigns equipment to a staff member
inspectionRouter.post(
  '/',
  requireRole('manager'),
  [
    body('equipmentId').isMongoId().withMessage('Choose a piece of equipment'),
    body('assignedStaffId').isMongoId().withMessage('Choose a staff member'),
    body('scheduledDate').isISO8601().withMessage('Choose a due date'),
  ],
  createInspection
);

// Finished checklist, from the phone. Also used when an offline submission is uploaded later.
inspectionRouter.post(
  '/submit',
  [
    body('inspectionId').isMongoId().withMessage('Invalid inspection id'),
    body('submissionId').isString().isLength({ min: 8, max: 64 }).withMessage('A submission id is required'),
    body('completedAt').optional().isISO8601().withMessage('Completed time must be a valid date'),
    body('items').isArray({ min: 1, max: 60 }).withMessage('Send the answered checklist items'),
    body('items.*.itemId').isString().isLength({ min: 1, max: 40 }).withMessage('Each item needs an id'),
    body('items.*.result').isIn(['pass', 'fail', 'flag']).withMessage('Each item must be Pass, Fail or Flag'),
    body('items.*.notes').optional({ values: 'null' }).isString().isLength({ max: 500 }).withMessage('Notes are limited to 500 characters'),
  ],
  submitInspection
);

// Marks a finished inspection as uploaded
inspectionRouter.patch('/:id/sync', param('id').isMongoId().withMessage('Invalid inspection id'), syncInspection);

export default inspectionRouter;
