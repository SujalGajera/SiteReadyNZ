// src/routes/equipmentRoutes.ts — Route definitions for equipment CRUD endpoints
// All routes require a valid JWT. POST, PUT, and DELETE also require the manager role
// because only managers are allowed to change equipment records.

import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuthentication } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../controllers/equipmentController';

const equipmentRouter = Router();

// Validation rules shared between create and update
const equipmentValidationRules = [
  body('name').trim().notEmpty().withMessage('Equipment name is required'),
  body('type')
    .isIn(['fire_extinguisher', 'first_aid', 'aed', 'safety_sign', 'other'])
    .withMessage('Invalid equipment type'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('expiryDate')
    .isISO8601()
    .withMessage('Expiry date must be a valid date (ISO 8601 format)'),
];

// All staff and managers can view equipment — both roles need to know what is on-site
equipmentRouter.get('/', requireAuthentication, getAllEquipment);
equipmentRouter.get('/:id', requireAuthentication, getEquipmentById);

// Only managers can create, update, or delete equipment records
equipmentRouter.post(
  '/',
  requireAuthentication,
  requireRole('manager'),
  equipmentValidationRules,
  createEquipment
);

equipmentRouter.put(
  '/:id',
  requireAuthentication,
  requireRole('manager'),
  [
    // On update, the same fields are valid but none are strictly required
    // (a partial update may only change one field)
    body('type')
      .optional()
      .isIn(['fire_extinguisher', 'first_aid', 'aed', 'safety_sign', 'other'])
      .withMessage('Invalid equipment type'),
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be a valid date'),
  ],
  updateEquipment
);

equipmentRouter.delete(
  '/:id',
  requireAuthentication,
  requireRole('manager'),
  deleteEquipment
);

export default equipmentRouter;
