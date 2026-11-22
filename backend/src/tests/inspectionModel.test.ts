// The Inspection model's JSON output: what the apps receive.
// No database is needed. A document is built in memory and turned into JSON.

import Inspection from '../models/Inspection';

const inspectionJson = (overrides: Record<string, unknown> = {}) =>
  new Inspection({
    organisationId: '64b000000000000000000001',
    equipmentId: '64b0000000000000000000aa',
    assignedStaffId: '64b000000000000000000002',
    assignedById: '64b000000000000000000001',
    scheduledDate: new Date('2030-01-01T00:00:00Z'),
    ...overrides,
  }).toJSON() as unknown as Record<string, unknown>;

describe('Inspection toJSON', () => {
  it('shows "Removed equipment" instead of null when the equipment has since been deleted', () => {
    // After a lookup finds nothing, Mongoose leaves null where the equipment details should be
    const json = inspectionJson({ equipmentId: null });
    expect(json.equipmentId).toMatchObject({ name: 'Removed equipment', type: 'other' });
  });

  it('leaves real equipment alone', () => {
    const json = inspectionJson();
    expect(String(json.equipmentId)).toBe('64b0000000000000000000aa');
  });

  it('shows an open inspection past its due day as "overdue", and a completed one as completed', () => {
    expect(inspectionJson({ scheduledDate: new Date('2020-01-01T00:00:00Z'), status: 'pending' }).status).toBe('overdue');
    expect(inspectionJson({ scheduledDate: new Date('2020-01-01T00:00:00Z'), status: 'completed' }).status).toBe('completed');
  });

  it('never sends the internal version counter', () => {
    expect(inspectionJson()).not.toHaveProperty('__v');
  });
});
