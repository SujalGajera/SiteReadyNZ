// The repositories are the one place that talks to Mongoose, so this is where the exact queries are checked,
// most importantly that every lookup is limited to the caller's workspace (`organisationId`).
// The models are replaced with fakes, so no database is needed.

import Equipment from '../models/Equipment';
import Inspection from '../models/Inspection';
import User from '../models/User';
import PushSubscription from '../models/PushSubscription';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { inspectionRepository } from '../repositories/inspectionRepository';
import { userRepository } from '../repositories/userRepository';
import { pushSubscriptionRepository } from '../repositories/pushSubscriptionRepository';

jest.mock('../models/Equipment', () => ({ __esModule: true, default: { find: jest.fn(), findOne: jest.fn(), create: jest.fn() } }));
jest.mock('../models/Inspection', () => ({ __esModule: true, default: { find: jest.fn(), findOne: jest.fn(), create: jest.fn() } }));
jest.mock('../models/User', () => ({ __esModule: true, default: { find: jest.fn(), findOne: jest.fn(), findById: jest.fn(), create: jest.fn() } }));
jest.mock('../models/PushSubscription', () => ({
  __esModule: true,
  default: { find: jest.fn(), findOneAndUpdate: jest.fn(), deleteOne: jest.fn(), deleteMany: jest.fn() },
}));

type Fake = Record<string, jest.Mock>;
const equipmentModel = Equipment as unknown as Fake;
const inspectionModel = Inspection as unknown as Fake;
const userModel = User as unknown as Fake;
const pushModel = PushSubscription as unknown as Fake;

/**
 * A fake Mongoose query. `.populate()`, `.sort()` and `.select()` return the same query and it
 * resolves to `result` when awaited, like the real thing. The calls are kept so tests can read them.
 */
interface FakeQuery<T> {
  populate: jest.Mock;
  sort: jest.Mock;
  select: jest.Mock;
  then: (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) => Promise<unknown>;
}

function query<T>(result: T): FakeQuery<T> {
  const q: FakeQuery<T> = {
    populate: jest.fn(() => q),
    sort: jest.fn(() => q),
    select: jest.fn(() => q),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

describe('equipmentRepository', () => {
  it('lists only the workspace\'s items, soonest expiry first, with the manager\'s name filled in', async () => {
    const q = query([{ _id: 'eq-1' }]);
    equipmentModel.find.mockReturnValue(q);
    await expect(equipmentRepository.listByOrganisation('org-1')).resolves.toEqual([{ _id: 'eq-1' }]);
    expect(equipmentModel.find).toHaveBeenCalledWith({ organisationId: 'org-1' });
    expect(q.populate).toHaveBeenCalledWith('assignedManagerId', 'name');
    expect(q.sort).toHaveBeenCalledWith({ expiryDate: 1 });
  });

  it('looks an item up by id AND workspace, so another business\'s item is never found', async () => {
    const q = query({ _id: 'eq-1' });
    equipmentModel.findOne.mockReturnValue(q);
    await equipmentRepository.findDetailed('eq-1', 'org-1');
    expect(equipmentModel.findOne).toHaveBeenCalledWith({ _id: 'eq-1', organisationId: 'org-1' });
    expect(q.populate).toHaveBeenCalledWith('assignedManagerId', 'name');

    equipmentModel.findOne.mockReturnValue(query(null));
    await expect(equipmentRepository.findInOrganisation('eq-1', 'org-2')).resolves.toBeNull();
    expect(equipmentModel.findOne).toHaveBeenLastCalledWith({ _id: 'eq-1', organisationId: 'org-2' });
  });

  it('fetches names for many ids in one query', async () => {
    const q = query([]);
    equipmentModel.find.mockReturnValue(q);
    await equipmentRepository.findNamesByIds(['a', 'b']);
    expect(equipmentModel.find).toHaveBeenCalledTimes(1);
    expect(equipmentModel.find).toHaveBeenCalledWith({ _id: { $in: ['a', 'b'] } });
    expect(q.select).toHaveBeenCalledWith('name');
  });

  it('creates through the model, saves through save() (so the status is recalculated) and removes through deleteOne()', async () => {
    equipmentModel.create.mockResolvedValue({ _id: 'new' });
    await equipmentRepository.create({ name: 'AED' });
    expect(equipmentModel.create).toHaveBeenCalledWith({ name: 'AED' });

    const doc = { save: jest.fn().mockResolvedValue('saved'), deleteOne: jest.fn().mockResolvedValue(undefined) };
    await expect(equipmentRepository.save(doc as never)).resolves.toBe('saved');
    await equipmentRepository.remove(doc as never);
    expect(doc.deleteOne).toHaveBeenCalledTimes(1);
  });
});

describe('inspectionRepository', () => {
  it('lists the workspace\'s inspections, soonest due first, with equipment and staff details', async () => {
    const q = query([]);
    inspectionModel.find.mockReturnValue(q);
    await inspectionRepository.listByOrganisation('org-1');
    expect(inspectionModel.find).toHaveBeenCalledWith({ organisationId: 'org-1' });
    expect(q.populate).toHaveBeenCalledWith('equipmentId', 'name type location');
    expect(q.populate).toHaveBeenCalledWith('assignedStaffId', 'name email');
    expect(q.sort).toHaveBeenCalledWith({ scheduledDate: 1 });
  });

  it('lists one person\'s inspections inside the workspace only', async () => {
    const q = query([]);
    inspectionModel.find.mockReturnValue(q);
    await inspectionRepository.listForStaff('org-1', 'staff-1');
    expect(inspectionModel.find).toHaveBeenCalledWith({ organisationId: 'org-1', assignedStaffId: 'staff-1' });
    expect(q.sort).toHaveBeenCalledWith({ scheduledDate: 1 });
  });

  it('finds one inspection by id AND workspace', async () => {
    inspectionModel.findOne.mockReturnValue(query(null));
    await inspectionRepository.findInOrganisation('insp-1', 'org-1');
    expect(inspectionModel.findOne).toHaveBeenCalledWith({ _id: 'insp-1', organisationId: 'org-1' });
  });

  it('finds only open jobs, so finished ones are never nagged about', async () => {
    inspectionModel.find.mockReturnValue(query([]));
    await inspectionRepository.findOpen();
    expect(inspectionModel.find).toHaveBeenLastCalledWith({ status: { $in: ['pending', 'in_progress'] } });
  });

  it('limits open jobs to one workspace when asked', async () => {
    inspectionModel.find.mockReturnValue(query([]));
    await inspectionRepository.findOpen('org-1');
    expect(inspectionModel.find).toHaveBeenLastCalledWith({ organisationId: 'org-1', status: { $in: ['pending', 'in_progress'] } });
  });

  it('creates an inspection and returns it with equipment and staff details filled in', async () => {
    const populate = jest.fn().mockResolvedValue('populated');
    inspectionModel.create.mockResolvedValue({ populate });
    await expect(inspectionRepository.createAndPopulate({ organisationId: 'org-1' })).resolves.toBe('populated');
    expect(inspectionModel.create).toHaveBeenCalledWith({ organisationId: 'org-1' });
    expect(populate).toHaveBeenCalledWith([
      { path: 'equipmentId', select: 'name type location' },
      { path: 'assignedStaffId', select: 'name email' },
    ]);
  });

  it('saves through save()', async () => {
    const doc = { save: jest.fn().mockResolvedValue('saved') };
    await expect(inspectionRepository.save(doc as never)).resolves.toBe('saved');
  });
});

describe('userRepository', () => {
  it('finds by email, and by email with the hidden password hash only for the login check', async () => {
    userModel.findOne.mockResolvedValue(null);
    await userRepository.findByEmail('a@example.com');
    expect(userModel.findOne).toHaveBeenLastCalledWith({ email: 'a@example.com' });

    const q = query(null);
    userModel.findOne.mockReturnValue(q);
    await userRepository.findByEmailWithPassword('a@example.com');
    expect(userModel.findOne).toHaveBeenLastCalledWith({ email: 'a@example.com' });
    expect(q.select).toHaveBeenCalledWith('+passwordHash');
  });

  it('finds by id and by Google id', async () => {
    userModel.findById.mockResolvedValue(null);
    await userRepository.findById('u1');
    expect(userModel.findById).toHaveBeenCalledWith('u1');

    userModel.findOne.mockResolvedValue(null);
    await userRepository.findByGoogleId('g-1');
    expect(userModel.findOne).toHaveBeenLastCalledWith({ googleId: 'g-1' });
  });

  it('only finds people inside the workspace', async () => {
    userModel.findOne.mockResolvedValue(null);
    await userRepository.findInOrganisation('u1', 'org-1');
    expect(userModel.findOne).toHaveBeenLastCalledWith({ _id: 'u1', organisationId: 'org-1' });
  });

  it('only accepts a STAFF member of the workspace when assigning work (never a manager, never another business)', async () => {
    userModel.findOne.mockResolvedValue(null);
    await userRepository.findStaffInOrganisation('staff-1', 'org-1');
    expect(userModel.findOne).toHaveBeenLastCalledWith({ _id: 'staff-1', role: 'staff', organisationId: 'org-1' });
  });

  it('lists only staff of the workspace, alphabetically', async () => {
    const q = query([]);
    userModel.find.mockReturnValue(q);
    await userRepository.listStaff('org-1');
    expect(userModel.find).toHaveBeenCalledWith({ role: 'staff', organisationId: 'org-1' });
    expect(q.sort).toHaveBeenCalledWith({ name: 1 });
  });

  it('fetches names for many ids in one query', async () => {
    const q = query([]);
    userModel.find.mockReturnValue(q);
    await userRepository.findNamesByIds(['a', 'b']);
    expect(userModel.find).toHaveBeenCalledWith({ _id: { $in: ['a', 'b'] } });
    expect(q.select).toHaveBeenCalledWith('name');
  });

  it('creates and saves', async () => {
    userModel.create.mockResolvedValue({ _id: 'u1' });
    await userRepository.create({ name: 'A' });
    expect(userModel.create).toHaveBeenCalledWith({ name: 'A' });
    const doc = { save: jest.fn().mockResolvedValue('saved') };
    await expect(userRepository.save(doc as never)).resolves.toBe('saved');
  });
});

describe('pushSubscriptionRepository', () => {
  it('finds all of one person\'s devices', async () => {
    pushModel.find.mockResolvedValue([]);
    await pushSubscriptionRepository.findByUser('user-1');
    expect(pushModel.find).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('removes every copy of a device that belongs to someone ELSE (a shared phone changing hands)', async () => {
    await pushSubscriptionRepository.removeFromOtherUsers('https://fcm.googleapis.com/a', 'user-2');
    expect(pushModel.deleteMany).toHaveBeenCalledWith({ endpoint: 'https://fcm.googleapis.com/a', userId: { $ne: 'user-2' } });
  });

  it('adds a device or refreshes its keys when it is already there', async () => {
    const keys = { p256dh: 'p', auth: 'a' };
    await pushSubscriptionRepository.upsert('user-1', 'https://fcm.googleapis.com/a', keys);
    expect(pushModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1', endpoint: 'https://fcm.googleapis.com/a' },
      { userId: 'user-1', endpoint: 'https://fcm.googleapis.com/a', keys },
      { upsert: true, new: true }
    );
  });

  it('forgets only that person\'s copy of that device', async () => {
    await pushSubscriptionRepository.remove('user-1', 'https://fcm.googleapis.com/a');
    expect(pushModel.deleteOne).toHaveBeenCalledWith({ userId: 'user-1', endpoint: 'https://fcm.googleapis.com/a' });
  });

  it('deletes a device the push service says is gone', async () => {
    const doc = { deleteOne: jest.fn().mockResolvedValue(undefined) };
    await pushSubscriptionRepository.delete(doc as never);
    expect(doc.deleteOne).toHaveBeenCalledTimes(1);
  });
});
