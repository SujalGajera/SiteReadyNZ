// src/repositories/userRepository.ts — REPOSITORY PATTERN for user accounts.
// The only file that knows how users are stored. See equipmentRepository.ts for the idea.

import User, { IUser } from '../models/User';

export interface UserRepository {
  findById(id: string): Promise<IUser | null>;
  /** Looks an account up by email. The email must already be trimmed and lower-case. */
  findByEmail(email: string): Promise<IUser | null>;
  /** Same, but also loads the password hash, which is hidden by default. Only the login check needs it. */
  findByEmailWithPassword(email: string): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
  /** Anyone in the workspace, whatever their role, or null (another workspace's user is null too) */
  findInOrganisation(id: string, organisationId: string): Promise<IUser | null>;
  /** A staff member (not a manager) in the workspace, or null */
  findStaffInOrganisation(id: string, organisationId: string): Promise<IUser | null>;
  /** All staff in the workspace, alphabetical */
  listStaff(organisationId: string): Promise<IUser[]>;
  /** Just the names of some people, in one query (used to word notifications) */
  findNamesByIds(ids: unknown[]): Promise<IUser[]>;
  create(data: Record<string, unknown>): Promise<IUser>;
  save(user: IUser): Promise<IUser>;
}

export const userRepository: UserRepository = {
  async findById(id) {
    return User.findById(id);
  },

  async findByEmail(email) {
    return User.findOne({ email });
  },

  async findByEmailWithPassword(email) {
    return User.findOne({ email }).select('+passwordHash');
  },

  async findByGoogleId(googleId) {
    return User.findOne({ googleId });
  },

  async findInOrganisation(id, organisationId) {
    return User.findOne({ _id: id, organisationId });
  },

  async findStaffInOrganisation(id, organisationId) {
    return User.findOne({ _id: id, role: 'staff', organisationId });
  },

  async listStaff(organisationId) {
    return User.find({ role: 'staff', organisationId }).sort({ name: 1 });
  },

  async findNamesByIds(ids) {
    return User.find({ _id: { $in: ids } }).select('name');
  },

  async create(data) {
    return User.create(data);
  },

  async save(user) {
    return user.save();
  },
};
