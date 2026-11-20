import webPush from 'web-push';
import { pushSubscriptionRepository } from '../repositories/pushSubscriptionRepository';
import { removeSubscription, saveSubscription, sendPushToUser } from '../services/pushService';

// Pretend VAPID keys are set, so the service is willing to send
jest.mock('../config/vapid', () => ({ isPushConfigured: true, publicVapidKey: 'public-key' }));
jest.mock('../config/logger', () => ({ __esModule: true, default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn() } }));
jest.mock('web-push', () => ({ __esModule: true, default: { sendNotification: jest.fn(), setVapidDetails: jest.fn() } }));
// The service is tested against a FAKE repository: these tests are about the rules, not about MongoDB.
jest.mock('../repositories/pushSubscriptionRepository', () => ({
  pushSubscriptionRepository: { findByUser: jest.fn(), removeFromOtherUsers: jest.fn(), upsert: jest.fn(), remove: jest.fn(), delete: jest.fn() },
}));

const repo = pushSubscriptionRepository as jest.Mocked<typeof pushSubscriptionRepository>;
const sendNotification = webPush.sendNotification as jest.Mock;

const keys = { p256dh: 'p256dh-key-long-enough-to-be-real', auth: 'auth-secret' };
const device = (endpoint: string) => ({ endpoint, keys });
/** Tells the fake repository which devices the person has */
const hasDevices = (devices: unknown[]) => repo.findByUser.mockResolvedValue(devices as never);
const payload = { title: 'Check due today', body: 'AED, main hall', url: '/inspections' };

describe('saveSubscription', () => {
  it('saves a device on a real push service', async () => {
    await saveSubscription('user-1', { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys });
    expect(repo.upsert).toHaveBeenCalledWith('user-1', 'https://fcm.googleapis.com/fcm/send/abc', keys);
  });

  it('refuses an address that is not a known push service (400) and saves nothing', async () => {
    await expect(saveSubscription('user-1', { endpoint: 'http://localhost:27017/x', keys })).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.upsert).not.toHaveBeenCalled();
    expect(repo.removeFromOtherUsers).not.toHaveBeenCalled();
  });

  it('moves a shared phone to the newest person by removing it from everyone else first', async () => {
    await saveSubscription('user-2', { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys });
    expect(repo.removeFromOtherUsers).toHaveBeenCalledWith('https://fcm.googleapis.com/fcm/send/abc', 'user-2');
    expect(repo.removeFromOtherUsers.mock.invocationCallOrder[0]).toBeLessThan(repo.upsert.mock.invocationCallOrder[0]);
  });
});

describe('sendPushToUser', () => {
  it('sends to every device the person has, with a 12-hour life, and counts them', async () => {
    hasDevices([device('https://fcm.googleapis.com/a'), device('https://fcm.googleapis.com/b')]);
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
    hasDevices([gone, alive]);
    sendNotification.mockImplementation(async (target: { endpoint: string }) => {
      if (target.endpoint.endsWith('/gone')) throw Object.assign(new Error('Gone'), { statusCode: 410 });
      return {};
    });
    const result = await sendPushToUser('user-1', payload);
    expect(result).toEqual({ devices: 2, delivered: 1, removed: 1, failed: 0 });
    expect(repo.delete).toHaveBeenCalledTimes(1);
    expect(repo.delete).toHaveBeenCalledWith(gone);
  });

  it('keeps a device after a temporary failure (such as a 500) and counts it as failed, not removed', async () => {
    const flaky = device('https://fcm.googleapis.com/flaky');
    hasDevices([flaky]);
    sendNotification.mockRejectedValue(Object.assign(new Error('Server error'), { statusCode: 500 }));
    const result = await sendPushToUser('user-1', payload);
    expect(result).toEqual({ devices: 1, delivered: 0, removed: 0, failed: 1 });
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('reports zero devices for a person who has not turned notifications on', async () => {
    hasDevices([]);
    expect(await sendPushToUser('user-1', payload)).toEqual({ devices: 0, delivered: 0, removed: 0, failed: 0 });
    expect(sendNotification).not.toHaveBeenCalled();
  });
});

describe('removeSubscription', () => {
  it('forgets only that person\'s copy of that device', async () => {
    await removeSubscription('user-1', 'https://fcm.googleapis.com/a');
    expect(repo.remove).toHaveBeenCalledWith('user-1', 'https://fcm.googleapis.com/a');
  });
});
