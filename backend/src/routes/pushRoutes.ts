// src/routes/pushRoutes.ts — URLs for push notifications.
// Every signed-in user manages their own devices. Only managers send notifications or run the checks.

import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuthentication } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import { getPublicKey, subscribe, unsubscribe, sendNotification, runChecks } from '../controllers/pushController';

const pushRouter = Router();

pushRouter.use(requireAuthentication);

const endpointRule = body('endpoint').isString().isLength({ min: 20, max: 1000 }).withMessage('A notification address is required');

// The key the browser needs before it can subscribe
pushRouter.get('/public-key', getPublicKey);

// Register or forget this device
pushRouter.post(
  '/subscribe',
  [
    endpointRule,
    body('keys.p256dh').isString().isLength({ min: 20, max: 200 }).withMessage('Missing encryption key'),
    body('keys.auth').isString().isLength({ min: 10, max: 100 }).withMessage('Missing auth secret'),
  ],
  subscribe
);
pushRouter.post('/unsubscribe', [endpointRule], unsubscribe);

// Manager only: send to a person in the workspace, or run the automatic checks now
pushRouter.post(
  '/send',
  requireRole('manager'),
  [
    body('targetUserId').isMongoId().withMessage('Choose who to notify'),
    body('title').isString().withMessage('This field is required and must be plain text').bail().trim().isLength({ min: 1, max: 80 }).withMessage('A title of up to 80 characters is required'),
    body('body').isString().withMessage('This field is required and must be plain text').bail().trim().isLength({ min: 1, max: 200 }).withMessage('A message of up to 200 characters is required'),
    // Only paths inside this app, never a full web address someone could use to send people elsewhere
    body('url').optional().isString().withMessage('url must be text').bail().matches(/^\/[A-Za-z0-9/_-]*$/).withMessage('url must be a path inside the app, like /inspections'),
  ],
  sendNotification
);
pushRouter.post('/run-checks', requireRole('manager'), runChecks);

export default pushRouter;
