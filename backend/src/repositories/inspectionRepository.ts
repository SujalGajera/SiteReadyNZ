// src/repositories/inspectionRepository.ts — REPOSITORY PATTERN for inspections.
// The only file that knows how inspections are stored. See equipmentRepository.ts for the idea.

import Inspection, { IInspection } from '../models/Inspection';

/** Inspections that still need doing. Finished ones are never reminded about. */
const OPEN_STATUSES = ['pending', 'in_progress'];

export interface InspectionRepository {
  /** Everything in the workspace, soonest due first, with equipment and staff details filled in */
  listByOrganisation(organisationId: string): Promise<IInspection[]>;
  /** One person's inspections inside the workspace, soonest due first, with equipment details filled in */
  listForStaff(organisationId: string, staffId: string): Promise<IInspection[]>;
  /** One inspection in the workspace, ready to be changed and saved, or null */
  findInOrganisation(id: string, organisationId: string): Promise<IInspection | null>;
  /** Open inspections. Leave the workspace out to look across every workspace (the timer does this). */
  findOpen(organisationId?: string): Promise<IInspection[]>;
  /** Saves a new inspection and returns it with equipment and staff details filled in */
  createAndPopulate(data: Record<string, unknown>): Promise<IInspection>;
  save(inspection: IInspection): Promise<IInspection>;
  /** Deletes one inspection */
  remove(inspection: IInspection): Promise<void>;
  /** Deletes the still-open inspections of one piece of equipment (used when the equipment itself is deleted) */
  removeOpenForEquipment(equipmentId: string, organisationId: string): Promise<number>;
}

export const inspectionRepository: InspectionRepository = {
  async listByOrganisation(organisationId) {
    return Inspection.find({ organisationId })
      .populate('equipmentId', 'name type location')
      .populate('assignedStaffId', 'name email')
      .sort({ scheduledDate: 1 });
  },

  async listForStaff(organisationId, staffId) {
    return Inspection.find({ organisationId, assignedStaffId: staffId })
      .populate('equipmentId', 'name type location')
      .sort({ scheduledDate: 1 });
  },

  async findInOrganisation(id, organisationId) {
    return Inspection.findOne({ _id: id, organisationId });
  },

  async findOpen(organisationId) {
    const scope = organisationId ? { organisationId } : {};
    return Inspection.find({ ...scope, status: { $in: OPEN_STATUSES } });
  },

  async createAndPopulate(data) {
    const created = await Inspection.create(data);
    return created.populate([
      { path: 'equipmentId', select: 'name type location' },
      { path: 'assignedStaffId', select: 'name email' },
    ]);
  },

  async save(inspection) {
    return inspection.save();
  },

  async remove(inspection) {
    await inspection.deleteOne();
  },

  async removeOpenForEquipment(equipmentId, organisationId) {
    const result = await Inspection.deleteMany({ organisationId, equipmentId, status: { $in: OPEN_STATUSES } });
    return result.deletedCount ?? 0;
  },
};
