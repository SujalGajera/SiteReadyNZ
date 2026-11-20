// src/services/staffService.ts — Managers create and list their staff.
// Staff belong to the workspace of the manager who creates them.
// Staff cannot sign themselves up as staff (that would let anyone claim a role).
// Instead a manager creates the account and hands over the first password.

import type { IUser } from '../models/User';
import { userRepository } from '../repositories/userRepository';
import { registerUser, RegisterInput } from './authService';

/** All staff accounts, alphabetical, for the staff page and for assigning inspections */
export async function listStaff(organisationId: string): Promise<IUser[]> {
  return userRepository.listStaff(organisationId);
}

/** Creates a staff account inside the manager's workspace. Throws 409 if the email is already registered. */
export async function createStaff(input: RegisterInput, organisationId: string): Promise<IUser> {
  return registerUser(input, 'staff', organisationId);
}
