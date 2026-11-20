// src/repositories/pushSubscriptionRepository.ts — REPOSITORY PATTERN for push devices.
// The only file that knows how notification subscriptions are stored. See equipmentRepository.ts.

import PushSubscription, { IPushSubscription } from '../models/PushSubscription';

export interface PushSubscriptionRepository {
  /** Every device this person has turned notifications on for */
  findByUser(userId: string): Promise<IPushSubscription[]>;
  /** Forgets every copy of this device that belongs to someone OTHER than `userId` (a shared phone changing hands) */
  removeFromOtherUsers(endpoint: string, userId: string): Promise<void>;
  /** Adds the device for this person, or refreshes its keys if it is already there */
  upsert(userId: string, endpoint: string, keys: { p256dh: string; auth: string }): Promise<void>;
  /** Forgets this person's copy of this device */
  remove(userId: string, endpoint: string): Promise<void>;
  /** Deletes a device the push service says no longer exists */
  delete(subscription: IPushSubscription): Promise<void>;
}

export const pushSubscriptionRepository: PushSubscriptionRepository = {
  async findByUser(userId) {
    return PushSubscription.find({ userId });
  },

  async removeFromOtherUsers(endpoint, userId) {
    await PushSubscription.deleteMany({ endpoint, userId: { $ne: userId } });
  },

  async upsert(userId, endpoint, keys) {
    await PushSubscription.findOneAndUpdate({ userId, endpoint }, { userId, endpoint, keys }, { upsert: true, new: true });
  },

  async remove(userId, endpoint) {
    await PushSubscription.deleteOne({ userId, endpoint });
  },

  async delete(subscription) {
    await subscription.deleteOne();
  },
};
