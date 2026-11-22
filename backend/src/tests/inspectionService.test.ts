import { inspectionRepository } from '../repositories/inspectionRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { userRepository } from '../repositories/userRepository';
import { assignInspection, deleteInspection, listAssignedTo, markSynced, submitInspection, type Caller } from '../services/inspectionService';

// The service is tested against FAKE repositories: these tests are about the rules, not about MongoDB.
jest.mock('../repositories/inspectionRepository', () => ({
  inspectionRepository: { listByOrganisation: jest.fn(), listForStaff: jest.fn(), findInOrganisation: jest.fn(), createAndPopulate: jest.fn(), save: jest.fn(), remove: jest.fn() },
}));
jest.mock('../repositories/equipmentRepository', () => ({ equipmentRepository: { findInOrganisation: jest.fn(), save: jest.fn() } }));
jest.mock('../repositories/userRepository', () => ({ userRepository: { findStaffInOrganisation: jest.fn() } }));

const inspections = inspectionRepository as jest.Mocked<typeof inspectionRepository>;
const equipments = equipmentRepository as jest.Mocked<typeof equipmentRepository>;
const users = userRepository as jest.Mocked<typeof userRepository>;

// Saving hands back the same document, like Mongoose does
beforeEach(() => {
  inspections.save.mockImplementation(async (doc) => doc);
  equipments.save.mockImplementation(async (doc) => doc);
});

const staff: Caller = { id: 'staff-1', role: 'staff', orgId: 'org-1' };
const manager: Caller = { id: 'manager-1', role: 'manager', orgId: 'org-1' };

/** A three-question inspection as it would be stored, still unanswered */
function openInspection(overrides: Record<string, unknown> = {}) {
  const inspection: Record<string, unknown> = {
    status: 'pending',
    assignedStaffId: 'staff-1',
    equipmentId: 'eq-1',
    createdAt: new Date('2026-11-01T00:00:00Z'),
    items: [
      { itemId: 'a', description: 'Gauge is green', category: 'Working', severity: 'critical', result: 'not_checked' },
      { itemId: 'b', description: 'Pin in place', category: 'Working', severity: 'critical', result: 'not_checked' },
      { itemId: 'c', description: 'Sign visible', category: 'Location', severity: 'low', result: 'not_checked' },
    ],
    set(this: Record<string, unknown>, values: Record<string, unknown>) { Object.assign(this, values); },
    ...overrides,
  };
  return inspection;
}

/** An answer for each of the three questions: Pass with no note, unless a question is listed in `overrides` */
const answers = (overrides: Record<string, { result: string; notes?: string }> = {}) =>
  ['a', 'b', 'c'].map((itemId) => {
    const custom = overrides[itemId];
    return { itemId, result: custom?.result ?? 'pass', notes: custom?.notes ?? '' };
  });

const submission = (extra: Record<string, unknown> = {}) => ({ inspectionId: 'insp-1', submissionId: 'sub-0001-aaaa', items: answers(), ...extra });

describe('submitInspection', () => {
  let equipment: { lastInspectedAt?: Date };
  beforeEach(() => {
    equipment = { lastInspectedAt: new Date('2026-09-01T00:00:00Z') };
    equipments.findInOrganisation.mockResolvedValue(equipment as never);
  });

  it('completes the inspection, stores the answers and marks it as synced', async () => {
    const inspection = openInspection();
    inspections.findInOrganisation.mockResolvedValue(inspection as never);
    await submitInspection(submission({ items: answers({ b: { result: 'fail', notes: 'Pin missing' } }) }), staff);
    expect(inspection.status).toBe('completed');
    expect(inspection.syncStatus).toBe('synced');
    expect((inspection.items as { itemId: string; result: string; notes: string }[]).find((i) => i.itemId === 'b')).toMatchObject({ result: 'fail', notes: 'Pin missing' });
  });

  it('records the check on the equipment, which is what clears a "check overdue" status', async () => {
    inspections.findInOrganisation.mockResolvedValue(openInspection() as never);
    await submitInspection(submission({ completedAt: new Date().toISOString() }), staff);
    expect(equipments.save).toHaveBeenCalledTimes(1);
    expect(equipments.findInOrganisation).toHaveBeenCalledWith('eq-1', 'org-1');
    expect(equipment.lastInspectedAt!.getTime()).toBeGreaterThan(new Date('2026-09-01').getTime());
  });

  it('is safe to repeat: the same submission id again returns the result without saving twice', async () => {
    const done = openInspection({ status: 'completed', submissionId: 'sub-0001-aaaa' });
    inspections.findInOrganisation.mockResolvedValue(done as never);
    await expect(submitInspection(submission(), staff)).resolves.toBe(done);
    expect(inspections.save).not.toHaveBeenCalled();
    expect(equipments.save).not.toHaveBeenCalled();
  });

  it('answers 409 when a DIFFERENT submission arrives for an inspection that is already complete', async () => {
    inspections.findInOrganisation.mockResolvedValue(openInspection({ status: 'completed', submissionId: 'sub-0001-aaaa' }) as never);
    await expect(submitInspection(submission({ submissionId: 'sub-9999-zzzz' }), staff)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('answers 400 and names the missing question when something is unanswered', async () => {
    inspections.findInOrganisation.mockResolvedValue(openInspection() as never);
    await expect(submitInspection(submission({ items: answers().slice(0, 2) }), staff)).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('Sign visible') });
  });

  it('requires a note for Fail and for Flag, but not for Pass', async () => {
    inspections.findInOrganisation.mockResolvedValue(openInspection() as never);
    await expect(submitInspection(submission({ items: answers({ a: { result: 'fail' } }) }), staff)).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('Add a note') });
    await expect(submitInspection(submission({ items: answers({ a: { result: 'flag', notes: '   ' } }) }), staff)).rejects.toMatchObject({ statusCode: 400 });
    await expect(submitInspection(submission({ items: answers() }), staff)).resolves.toBeDefined();
  });

  it('refuses "not_checked" or nonsense as an answer', async () => {
    inspections.findInOrganisation.mockResolvedValue(openInspection() as never);
    await expect(submitInspection(submission({ items: answers({ a: { result: 'not_checked' } }) }), staff)).rejects.toMatchObject({ statusCode: 400 });
    await expect(submitInspection(submission({ items: answers({ a: { result: 'maybe' } }) }), staff)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('ignores questions that are not on the inspection, and never takes wording or severity from the phone', async () => {
    const inspection = openInspection();
    inspections.findInOrganisation.mockResolvedValue(inspection as never);
    const tampered = [...answers(), { itemId: 'zzz', result: 'pass', notes: '' }].map((item) => ({ ...item, severity: 'low', description: 'changed' }));
    await submitInspection(submission({ items: tampered }), staff);
    const stored = inspection.items as { itemId: string; severity: string; description: string }[];
    expect(stored).toHaveLength(3);
    expect(stored.find((i) => i.itemId === 'a')).toMatchObject({ severity: 'critical', description: 'Gauge is green' });
  });

  it('answers 403 when a different staff member tries to submit it', async () => {
    inspections.findInOrganisation.mockResolvedValue(openInspection({ assignedStaffId: 'someone-else' }) as never);
    await expect(submitInspection(submission(), staff)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('answers 404 when the inspection is in another workspace', async () => {
    inspections.findInOrganisation.mockResolvedValue(null as never);
    await expect(submitInspection(submission(), staff)).rejects.toMatchObject({ statusCode: 404 });
    expect(inspections.findInOrganisation).toHaveBeenCalledWith('insp-1', 'org-1');
  });

  it('keeps the phone\'s finish time when it is sensible, but replaces one from the future', async () => {
    const earlier = new Date(Date.now() - 20 * 60 * 1000);
    const sensible = openInspection({ createdAt: new Date(Date.now() - 3600 * 1000) });
    inspections.findInOrganisation.mockResolvedValue(sensible as never);
    await submitInspection(submission({ completedAt: earlier.toISOString() }), staff);
    expect((sensible.completedAt as Date).getTime()).toBe(earlier.getTime());

    const future = openInspection();
    inspections.findInOrganisation.mockResolvedValue(future as never);
    await submitInspection(submission({ completedAt: new Date(Date.now() + 86_400_000).toISOString() }), staff);
    expect((future.completedAt as Date).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });
});

describe('assignInspection', () => {
  const input = { equipmentId: 'eq-1', assignedStaffId: 'staff-1', scheduledDate: '2026-11-20' };

  it('builds the checklist from the equipment type and attaches the workspace and the assigning manager', async () => {
    equipments.findInOrganisation.mockResolvedValue({ _id: 'eq-1', type: 'first_aid' } as never);
    users.findStaffInOrganisation.mockResolvedValue({ _id: 'staff-1' } as never);
    inspections.createAndPopulate.mockResolvedValue('populated' as never);
    await expect(assignInspection(input, manager)).resolves.toBe('populated');
    const created = inspections.createAndPopulate.mock.calls[0][0] as { items: unknown[] };
    expect(created.items).toHaveLength(6); // the first-aid template
    expect(created).toMatchObject({ organisationId: 'org-1', assignedById: 'manager-1' });
  });

  it('answers 404 for equipment in another workspace', async () => {
    equipments.findInOrganisation.mockResolvedValue(null);
    await expect(assignInspection(input, manager)).rejects.toMatchObject({ statusCode: 404 });
    expect(equipments.findInOrganisation).toHaveBeenCalledWith('eq-1', 'org-1');
    expect(inspections.createAndPopulate).not.toHaveBeenCalled();
  });

  it('only accepts a person who is STAFF in the same workspace', async () => {
    equipments.findInOrganisation.mockResolvedValue({ _id: 'eq-1', type: 'aed' } as never);
    users.findStaffInOrganisation.mockResolvedValue(null);
    await expect(assignInspection(input, manager)).rejects.toMatchObject({ statusCode: 404 });
    expect(users.findStaffInOrganisation).toHaveBeenCalledWith('staff-1', 'org-1');
    expect(inspections.createAndPopulate).not.toHaveBeenCalled();
  });
});

describe('listAssignedTo', () => {
  it('answers 403 when a staff member asks for a colleague\'s list', async () => {
    await expect(listAssignedTo('someone-else', staff)).rejects.toMatchObject({ statusCode: 403 });
    expect(inspections.listForStaff).not.toHaveBeenCalled();
  });

  it('lets a manager ask for anyone\'s list, still inside the workspace', async () => {
    inspections.listForStaff.mockResolvedValue([]);
    await listAssignedTo('staff-1', manager);
    expect(inspections.listForStaff).toHaveBeenCalledWith('org-1', 'staff-1');
  });
});

describe('deleteInspection', () => {
  it('deletes an open inspection found in the manager\'s workspace', async () => {
    const open = openInspection();
    inspections.findInOrganisation.mockResolvedValue(open as never);
    await deleteInspection('insp-1', manager);
    expect(inspections.findInOrganisation).toHaveBeenCalledWith('insp-1', 'org-1');
    expect(inspections.remove).toHaveBeenCalledWith(open);
  });

  it('keeps a completed inspection as a record (409) and deletes nothing', async () => {
    inspections.findInOrganisation.mockResolvedValue(openInspection({ status: 'completed' }) as never);
    await expect(deleteInspection('insp-1', manager)).rejects.toMatchObject({ statusCode: 409 });
    expect(inspections.remove).not.toHaveBeenCalled();
  });

  it('answers 404 for an inspection in another workspace, and deletes nothing', async () => {
    inspections.findInOrganisation.mockResolvedValue(null);
    await expect(deleteInspection('insp-1', manager)).rejects.toMatchObject({ statusCode: 404 });
    expect(inspections.remove).not.toHaveBeenCalled();
  });
});

describe('markSynced', () => {
  it('only works for a completed inspection (409 otherwise)', async () => {
    inspections.findInOrganisation.mockResolvedValue(openInspection() as never);
    await expect(markSynced('insp-1', staff)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('marks a completed inspection as synced', async () => {
    const done = openInspection({ status: 'completed', syncStatus: 'pending_sync' });
    inspections.findInOrganisation.mockResolvedValue(done as never);
    await markSynced('insp-1', staff);
    expect(done.syncStatus).toBe('synced');
  });
});
