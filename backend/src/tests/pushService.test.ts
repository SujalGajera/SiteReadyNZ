import webPush from 'web-push';
import PushSubscription from '../models/PushSubscription';
import { removeSubscription, saveSubscription, sendPushToUser } from '../services/pushService';

// Pretend VAPID keys are set, so the service is willing to send
jest.mock('../config/vapid', () => ({ isPushConfigured: true, publicVapidKey: 'public-key' }));
jest.mock('../config/logger', () => ({ __esModule: true, default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn() } }));
jest.mock('web-push', () => ({ __esModule: true, default: { sendNotification: jest.fn(), setVapidDetails: jest.fn() } }));
jest.mock('../models/PushSubscription', () => ({
  __esModule: true,
  default: { find: jest.fn(), findOneAndUpdate: jest.fn(), deleteOne: jest.fn(), deleteMany: jest.fn() },
}));

const subscriptions = PushSubscription as unknown as { find: jest.Mock; findOneAndUpdate: jest.Mock; deleteOne: jest.Mock; deleteMany: jest.Mock };
const sendNotification = webPush.sendNotification as jest.Mock;

const keys = { p256dh: 'p256dh-key-long-enough-to-be-real', auth: 'auth-secret' };
const device = (endpoint: string) => ({ endpoint, keys, deleteOne: jest.fn().mockResolvedValue(undefined) });
const payload = { title: 'Check due today', body: 'AED, main hall', url: '/inspections' };

describe('saveSubscription', () => {
  it('saves a device on a real push service', async () => {
    await saveSubscription('user-1', { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys });
    expect(subscriptions.findOneAndUpdate).toHaveBeenCalledWith({ userId: 'user-1', endpoint: 'https://fcm.googleapis.com/fcm/send/abc' }, expect.any(Object), expect.objectContaining({ upsert: true }));
  });

  it('refuses an address that is not a known push service (400) and saves nothing', async () => {
    await expect(saveSubscription('user-1', { endpoint: 'http://localhost:27017/x', keys })).rejects.toMatchObject({ statusCode: 400 });
    expect(subscriptions.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('moves a shared phone to the newest person by removing it from everyone else first', async () => {
    await saveSubscription('user-2', { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys });
    expect(subscriptions.deleteMany).toHaveBeenCalledWith({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', userId: { $ne: 'user-2' } });
  });
});

describe('sendPushToUser', () => {
  it('sends to every device the person has, with a 12-hour life, and counts them', async () => {
    subscriptions.find.mockResolvedValue([device('https://fcm.googleapis.com/a'), device('https://fcm.googleapis.com/b')]);
    sendNotification.mockResolvedValue({});
    const result = await sendPushToUser('user-1', payload);
    expect(result).toEqual({ devices: 2, delivered: 2, removed: 0, failed: 0 });
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification.mock.calls[0][2]).toMatchObject({ TTL: 12 * 60 * 60 });
    expect(JSON.parse(sendNotification.mock.calls[0][1] as string)).toEqual(payload);
  });

  it('deletes a device the push service says is gone (410), and carries on with the others', async () => {
    const gone = device('https://fcm.googleapis.com/gone');
    const alive = device('https://fcm.googleapis.com/alive');
    subscriptions.find.mockResolvedValue([gone, alive]);
    sendNotification.mockImplementation(async (target: { endpoint: string }) => {
      if (target.endpoint.endsWith('/gone')) throw Object.assign(new Error('Gone'), { statusCode: 410 });
      return {};
    });
    const result = await sendPushToUser('user-1', payload);
    expect(result).toEqual({ devices: 2, delivered: 1, removed: 1, failed: 0 });
    expect(gone.deleteOne).toHaveBeenCalledTimes(1);
    expect(alive.deleteOne).not.toHaveBeenCalled();
  });

  it('keeps a device after a temporary failure (such as a 500) and counts it as failed, not removed', async () => {
    const flaky = device('https://fcm.googleapis.com/flaky');
    subscriptions.find.mockResolvedValue([flaky]);
    sendNotification.mockRejectedValue(Object.assign(new Error('Server error'), { statusCode: 500 }));
    const result = await sendPushToUser('user-1', payload);
    expect(result).toEqual({ devices: 1, delivered: 0, removed: 0, failed: 1 });
    expect(flaky.deleteOne).not.toHaveBeenCalled();
  });

  it('reports zero devices for a person who has not turned notifications on', async () => {
    subscriptions.find.mockResolvedValue([]);
    expect(await sendPushToUser('user-1', payload)).toEqual({ devices: 0, delivered: 0, removed: 0, failed: 0 });
    expect(sendNotification).not.toHaveBeenCalled();
  });
});

describe('removeSubscription', () => {
  it('forgets only that person\'s copy of that device', async () => {
    await removeSubscription('user-1', 'https://fcm.googleapis.com/a');
    expect(subscriptions.deleteOne).toHaveBeenCalledWith({ userId: 'user-1', endpoint: 'https://fcm.googleapis.com/a' });
  });
});
