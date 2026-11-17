// src/routes/staffRoutes.ts — Managers only.

import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuthentication } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import { getStaff, addStaff } from '../controllers/staffController';

const staffRouter = Router();

// Every route here needs a signed-in manager
staffRouter.use(requireAuthentication, requireRole('manager'));

staffRouter.get('/', getStaff);

staffRouter.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }).withMessage('Name is too long'),
    body('email').trim().isEmail().withMessage('A valid email address is required'),
    body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be between 8 and 72 characters'),
  ],
  addStaff
);

export default staffRouter;
