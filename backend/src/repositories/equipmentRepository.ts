// src/repositories/equipmentRepository.ts — REPOSITORY PATTERN for equipment.
//
// A repository is the only place that knows HOW equipment is stored (here: MongoDB through Mongoose).
// Services ask it for things in plain terms ("the item with this id in this workspace") and keep
// all the business rules to themselves. Two benefits:
//   1. The workspace filter (`organisationId`) is written once, here, so a service cannot forget it.
//   2. Tests give a service a fake repository instead of a fake database.

import Equipment, { IEquipment } from '../models/Equipment';

export interface EquipmentRepository {
  /** Every item in the workspace, soonest expiry first, with the owning manager's name filled in */
  listByOrganisation(organisationId: string): Promise<IEquipment[]>;
  /** One item in the workspace with the manager's name filled in, or null. Another workspace's item is null too. */
  findDetailed(id: string, organisationId: string): Promise<IEquipment | null>;
  /** One item in the workspace, ready to be changed and saved, or null */
  findInOrganisation(id: string, organisationId: string): Promise<IEquipment | null>;
  /** Just the names of some items, in one query (used to word notifications) */
  findNamesByIds(ids: unknown[]): Promise<IEquipment[]>;
  create(data: Record<string, unknown>): Promise<IEquipment>;
  /** Saves through Mongoose `save()`, so the pre-save hook recalculates the status */
  save(equipment: IEquipment): Promise<IEquipment>;
  remove(equipment: IEquipment): Promise<void>;
  /** Makes the database indexes match the model (run once at start-up) */
  syncIndexes(): Promise<void>;
}

export const equipmentRepository: EquipmentRepository = {
  async listByOrganisation(organisationId) {
    return Equipment.find({ organisationId }).populate('assignedManagerId', 'name').sort({ expiryDate: 1 });
  },

  async findDetailed(id, organisationId) {
    return Equipment.findOne({ _id: id, organisationId }).populate('assignedManagerId', 'name');
  },

  async findInOrganisation(id, organisationId) {
    return Equipment.findOne({ _id: id, organisationId });
  },

  async findNamesByIds(ids) {
    return Equipment.find({ _id: { $in: ids } }).select('name');
  },

  async create(data) {
    return Equipment.create(data);
  },

  async save(equipment) {
    return equipment.save();
  },

  async remove(equipment) {
    await equipment.deleteOne();
  },

  async syncIndexes() {
    await Equipment.syncIndexes();
  },
};
