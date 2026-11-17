// src/routes/equipmentRoutes.ts — URLs for equipment.
// Everyone signed in can read equipment. Only managers can create, change or delete it.

import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuthentication } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import { EQUIPMENT_TYPES } from '../models/Equipment';
import {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../controllers/equipmentController';

const equipmentRouter = Router();

// Rejects ids that are not valid MongoDB ids, so a typo gives a 400 instead of a database error
const idRule = param('id').isMongoId().withMessage('Invalid equipment id');

/**
 * Field rules. On create, name/type/location/expiryDate are required. On update every
 * field is optional, so a partial change (just the expiry date) is valid.
 */
function equipmentFieldRules(isUpdate: boolean) {
  const required = <T extends ReturnType<typeof body>>(chain: T): T => (isUpdate ? (chain.optional() as T) : chain);

  return [
    required(body('name')).trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }).withMessage('Name is too long'),
    required(body('type')).isIn(EQUIPMENT_TYPES).withMessage('Choose a valid equipment type'),
    required(body('location')).trim().notEmpty().withMessage('Location is required').isLength({ max: 160 }).withMessage('Location is too long'),
    required(body('expiryDate')).isISO8601().withMessage('Expiry date must be a valid date'),
    // Optional on both create and update. Blank is allowed and means "not set".
    body('serialNumber').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Serial number is too long'),
    body('purchaseDate').optional({ values: 'falsy' }).isISO8601().withMessage('Purchase date must be a valid date'),
    body('lastInspectedAt').optional({ values: 'falsy' }).isISO8601().withMessage('Last inspected date must be a valid date'),
  ];
}

// Read: any signed-in user
equipmentRouter.get('/', requireAuthentication, getAllEquipment);
equipmentRouter.get('/:id', requireAuthentication, idRule, getEquipmentById);

// Write: managers only
equipmentRouter.post('/', requireAuthentication, requireRole('manager'), equipmentFieldRules(false), createEquipment);
equipmentRouter.put('/:id', requireAuthentication, requireRole('manager'), idRule, equipmentFieldRules(true), updateEquipment);
equipmentRouter.delete('/:id', requireAuthentication, requireRole('manager'), idRule, deleteEquipment);

export default equipmentRouter;
