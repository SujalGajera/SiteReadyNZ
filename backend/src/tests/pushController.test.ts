import User from '../models/User';
import { getPublicKey, runChecks, sendNotification, subscribe, unsubscribe } from '../controllers/pushController';
import * as pushService from '../services/pushService';
import { runNotificationSweep } from '../services/notificationService';
import { fakeNext, fakeRequest, fakeResponse, MANAGER } from './helpers';

let mockConfigured = true;
jest.mock('../config/vapid', () => ({
  get isPushConfigured() {
    return mockConfigured;
  },
  publicVapidKey: 'public-key-for-tests',
}));
jest.mock('../models/User', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('../services/pushService');
jest.mock('../services/notificationService');

const userModel = User as unknown as { findOne: jest.Mock };
const service = pushService as jest.Mocked<typeof pushService>;

beforeEach(() => {
  mockConfigured = true;
});

describe('getPublicKey', () => {
  it('answers 200 with only the public key', () => {
    const res = fakeResponse();
    getPublicKey(fakeRequest(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ publicKey: 'public-key-for-tests' });
  });

  it('answers 503 with a plain message when push is not set up on this server', () => {
    mockConfigured = false;
    const res = fakeResponse();
    getPublicKey(fakeRequest(), res);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe('subscribe and unsubscribe', () => {
  const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'a'.repeat(30), auth: 'b'.repeat(12) } };

  it('saves the device for the signed-in person only, and answers 200', async () => {
    const res = fakeResponse();
    await subscribe(fakeRequest({ user: MANAGER, body: subscription }), res, fakeNext());
    expect(service.saveSubscription).toHaveBeenCalledWith('manager-1', subscription);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('passes a refusal (an unsafe address) to the error handler', async () => {
    const refusal = Object.assign(new Error('not a push service'), { statusCode: 400 });
    service.saveSubscription.mockRejectedValue(refusal);
    const next = fakeNext();
    await subscribe(fakeRequest({ user: MANAGER, body: subscription }), fakeResponse(), next);
    expect(next).toHaveBeenCalledWith(refusal);
  });

  it('forgets the device and answers 204 with no body', async () => {
    const res = fakeResponse();
    await unsubscribe(fakeRequest({ user: MANAGER, body: { endpoint: subscription.endpoint } }), res, fakeNext());
    expect(service.removeSubscription).toHaveBeenCalledWith('manager-1', subscription.endpoint);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('sendNotification', () => {
  const body = { targetUserId: 'staff-1', title: 'Check due', body: 'AED, hall', url: '/inspections' };

  it('only finds the person inside the manager\'s own workspace', async () => {
    userModel.findOne.mockResolvedValue({ _id: 'staff-1' });
    service.sendPushToUser.mockResolvedValue({ devices: 1, delivered: 1, removed: 0, failed: 0 });
    await sendNotification(fakeRequest({ user: MANAGER, body }), fakeResponse(), fakeNext());
    expect(userModel.findOne).toHaveBeenCalledWith({ _id: 'staff-1', organisationId: 'org-1' });
  });

  it('answers 404 for someone in another business, and sends nothing', async () => {
    userModel.findOne.mockResolvedValue(null);
    const res = fakeResponse();
    await sendNotification(fakeRequest({ user: MANAGER, body }), res, fakeNext());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(service.sendPushToUser).not.toHaveBeenCalled();
  });

  it.each([
    [{ devices: 0, delivered: 0, removed: 0, failed: 0 }, /not turned notifications on/],
    [{ devices: 1, delivered: 1, removed: 0, failed: 0 }, /Notification sent/],
    [{ devices: 1, delivered: 0, removed: 0, failed: 1 }, /could not be delivered/],
  ])('describes the outcome honestly: %j', async (result, message) => {
    userModel.findOne.mockResolvedValue({ _id: 'staff-1' });
    service.sendPushToUser.mockResolvedValue(result);
    const res = fakeResponse();
    await sendNotification(fakeRequest({ user: MANAGER, body }), res, fakeNext());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ...result, message: expect.stringMatching(message) }));
  });
});

describe('runChecks', () => {
  it('runs the sweep for the manager\'s workspace only and returns the counts', async () => {
    jest.mocked(runNotificationSweep).mockResolvedValue({ reminders: 2, lateAlerts: 1 });
    const res = fakeResponse();
    await runChecks(fakeRequest({ user: MANAGER }), res, fakeNext());
    expect(runNotificationSweep).toHaveBeenCalledWith({ organisationId: 'org-1' });
    expect(res.json).toHaveBeenCalledWith({ reminders: 2, lateAlerts: 1 });
  });
});
