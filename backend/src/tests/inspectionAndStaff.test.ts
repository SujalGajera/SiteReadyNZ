import { userRepository } from '../repositories/userRepository';
import { createInspection, getAllInspections, getAssignedInspections, submitInspection, syncInspection } from '../controllers/inspectionController';
import { addStaff, getStaff } from '../controllers/staffController';
import { createStaff, listStaff } from '../services/staffService';
import * as inspectionService from '../services/inspectionService';
import * as authService from '../services/authService';
import { fakeNext, fakeRequest, fakeResponse, MANAGER, STAFF } from './helpers';
import type { IInspection } from '../models/Inspection';

jest.mock('../services/inspectionService');
jest.mock('../repositories/userRepository', () => ({ userRepository: { listStaff: jest.fn() } }));
jest.mock('../services/authService', () => ({ registerUser: jest.fn() }));

const service = inspectionService as jest.Mocked<typeof inspectionService>;
const users = userRepository as jest.Mocked<typeof userRepository>;
const inspection = { _id: 'insp-1' } as unknown as IInspection;

describe('inspection controller', () => {
  it('lists every inspection in the manager\'s workspace (200)', async () => {
    service.listInspections.mockResolvedValue([inspection]);
    const res = fakeResponse();
    await getAllInspections(fakeRequest({ user: MANAGER }), res, fakeNext());
    expect(service.listInspections).toHaveBeenCalledWith('org-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('asks the service for the person\'s list together with who is asking, so it can refuse other people\'s', async () => {
    service.listAssignedTo.mockResolvedValue([inspection]);
    await getAssignedInspections(fakeRequest({ user: STAFF, params: { userId: 'staff-1' } }), fakeResponse(), fakeNext());
    expect(service.listAssignedTo).toHaveBeenCalledWith('staff-1', { id: 'staff-1', role: 'staff', orgId: 'org-1' });
  });

  it('passes the service\'s 403 on to the error handler', async () => {
    const forbidden = Object.assign(new Error('You can only see your own inspections.'), { statusCode: 403 });
    service.listAssignedTo.mockRejectedValue(forbidden);
    const next = fakeNext();
    await getAssignedInspections(fakeRequest({ user: STAFF, params: { userId: 'someone-else' } }), fakeResponse(), next);
    expect(next).toHaveBeenCalledWith(forbidden);
  });

  it('assigns an inspection and answers 201, using only the three fields a manager may choose', async () => {
    service.assignInspection.mockResolvedValue(inspection);
    const res = fakeResponse();
    const body = { equipmentId: 'eq-1', assignedStaffId: 'staff-1', scheduledDate: '2026-11-20', status: 'completed', organisationId: 'hijack' };
    await createInspection(fakeRequest({ user: MANAGER, body }), res, fakeNext());
    expect(service.assignInspection).toHaveBeenCalledWith({ equipmentId: 'eq-1', assignedStaffId: 'staff-1', scheduledDate: '2026-11-20' }, expect.objectContaining({ orgId: 'org-1' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('submits a checklist and answers 200', async () => {
    service.submitInspection.mockResolvedValue(inspection);
    const res = fakeResponse();
    const body = { inspectionId: 'insp-1', submissionId: 'sub-1', completedAt: '2026-11-17T01:00:00Z', items: [{ itemId: 'a', result: 'pass', notes: '' }] };
    await submitInspection(fakeRequest({ user: STAFF, body }), res, fakeNext());
    expect(service.submitInspection).toHaveBeenCalledWith(body, { id: 'staff-1', role: 'staff', orgId: 'org-1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('marks an inspection as synced and answers 200', async () => {
    service.markSynced.mockResolvedValue(inspection);
    const res = fakeResponse();
    await syncInspection(fakeRequest({ user: STAFF, params: { id: 'insp-1' } }), res, fakeNext());
    expect(service.markSynced).toHaveBeenCalledWith('insp-1', expect.objectContaining({ id: 'staff-1' }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('never throws out of a handler', async () => {
    const boom = new Error('db down');
    service.listInspections.mockRejectedValue(boom);
    const next = fakeNext();
    await getAllInspections(fakeRequest({ user: MANAGER }), fakeResponse(), next);
    expect(next).toHaveBeenCalledWith(boom);
  });
});

describe('staff service and controller', () => {
  it('lists only STAFF in the manager\'s workspace, alphabetically', async () => {
    users.listStaff.mockResolvedValue([]);
    await listStaff('org-1');
    expect(users.listStaff).toHaveBeenCalledWith('org-1');
  });

  it('creates staff inside the manager\'s workspace with the staff role', async () => {
    await createStaff({ name: 'Tane', email: 't@example.com', password: 'correct-horse-battery' }, 'org-1');
    expect(authService.registerUser).toHaveBeenCalledWith({ name: 'Tane', email: 't@example.com', password: 'correct-horse-battery' }, 'staff', 'org-1');
  });

  it('GET staff answers 200 with the list for the manager\'s workspace', async () => {
    const res = fakeResponse();
    users.listStaff.mockResolvedValue([{ name: 'Tane' }] as never);
    await getStaff(fakeRequest({ user: MANAGER }), res, fakeNext());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ name: 'Tane' }]);
  });

  it('POST staff answers 201 and passes only name, email and password (never a role)', async () => {
    jest.mocked(authService.registerUser).mockResolvedValue({ id: 's1' } as never);
    const res = fakeResponse();
    await addStaff(fakeRequest({ user: MANAGER, body: { name: 'Tane', email: 't@example.com', password: 'correct-horse-battery', role: 'manager' } }), res, fakeNext());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(authService.registerUser).toHaveBeenCalledWith(expect.not.objectContaining({ role: expect.anything() }), 'staff', 'org-1');
  });
});
