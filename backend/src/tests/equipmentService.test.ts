import { equipmentRepository } from '../repositories/equipmentRepository';
import { inspectionRepository } from '../repositories/inspectionRepository';
import { createEquipment, deleteEquipment, getEquipment, listEquipment, updateEquipment } from '../services/equipmentService';

// The service is tested against a FAKE repository: these tests are about the rules,
// not about how MongoDB is queried (that is covered in repositories.test.ts).
jest.mock('../repositories/equipmentRepository', () => ({
  equipmentRepository: {
    listByOrganisation: jest.fn(),
    findDetailed: jest.fn(),
    findInOrganisation: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../repositories/inspectionRepository', () => ({ inspectionRepository: { removeOpenForEquipment: jest.fn() } }));

const repo = equipmentRepository as jest.Mocked<typeof equipmentRepository>;
const inspections = inspectionRepository as jest.Mocked<typeof inspectionRepository>;

/** A stand-in for a Mongoose document that records what was set on it */
function fakeDocument() {
  return { set: jest.fn() };
}

describe('listEquipment', () => {
  it('only asks for the caller\'s workspace', async () => {
    repo.listByOrganisation.mockResolvedValue([]);
    await listEquipment('org-1');
    expect(repo.listByOrganisation).toHaveBeenCalledWith('org-1');
  });
});

describe('getEquipment', () => {
  it('looks for the id AND the workspace, so another business\'s item can never be read', async () => {
    repo.findDetailed.mockResolvedValue({ _id: 'eq-1' } as never);
    await getEquipment('eq-1', 'org-1');
    expect(repo.findDetailed).toHaveBeenCalledWith('eq-1', 'org-1');
  });

  it('answers 404 for an item that does not exist, or belongs to someone else', async () => {
    repo.findDetailed.mockResolvedValue(null);
    await expect(getEquipment('eq-1', 'org-2')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('createEquipment', () => {
  beforeEach(() => {
    repo.create.mockResolvedValue({} as never);
  });

  it('records the creating manager and the workspace', async () => {
    await createEquipment({ name: 'AED', type: 'aed', location: 'Hall', expiryDate: '2027-01-01' }, 'manager-1', 'org-1');
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ assignedManagerId: 'manager-1', organisationId: 'org-1', name: 'AED' }));
  });

  it('ignores fields a client should never set: status, _id and organisationId', async () => {
    const sneaky = { name: 'AED', type: 'aed', location: 'Hall', expiryDate: '2027-01-01', status: 'ok', _id: 'forced-id', organisationId: 'someone-elses' };
    await createEquipment(sneaky as never, 'manager-1', 'org-1');
    const saved = repo.create.mock.calls[0][0];
    expect(saved).not.toHaveProperty('status');
    expect(saved).not.toHaveProperty('_id');
    expect(saved.organisationId).toBe('org-1'); // the server's value wins
  });

  it('turns a blank serial number into "not set" instead of saving an empty string', async () => {
    await createEquipment({ name: 'AED', type: 'aed', location: 'Hall', expiryDate: '2027-01-01', serialNumber: '' }, 'm', 'o');
    expect(repo.create.mock.calls[0][0].serialNumber).toBeUndefined();
  });
});

describe('updateEquipment', () => {
  it('changes only the allowed fields, then saves the item through the repository', async () => {
    const doc = fakeDocument();
    repo.findInOrganisation.mockResolvedValue(doc as never);
    repo.save.mockResolvedValue(doc as never);
    await updateEquipment('eq-1', 'org-1', { location: 'Warehouse', status: 'ok', organisationId: 'hijack' } as never);
    expect(repo.findInOrganisation).toHaveBeenCalledWith('eq-1', 'org-1');
    expect(doc.set).toHaveBeenCalledWith({ location: 'Warehouse' });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(doc);
  });

  it('can clear the serial number with a blank value', async () => {
    const doc = fakeDocument();
    repo.findInOrganisation.mockResolvedValue(doc as never);
    await updateEquipment('eq-1', 'org-1', { serialNumber: '' });
    expect(doc.set).toHaveBeenCalledWith({ serialNumber: undefined });
  });

  it('answers 404 and saves nothing when the item is not in the workspace', async () => {
    repo.findInOrganisation.mockResolvedValue(null);
    await expect(updateEquipment('eq-1', 'org-2', { name: 'x' })).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe('deleteEquipment', () => {
  it('deletes the item found in the caller\'s workspace', async () => {
    const doc = fakeDocument();
    repo.findInOrganisation.mockResolvedValue(doc as never);
    await deleteEquipment('eq-1', 'org-1');
    expect(repo.findInOrganisation).toHaveBeenCalledWith('eq-1', 'org-1');
    expect(repo.remove).toHaveBeenCalledWith(doc);
  });

  it('also deletes the inspections of that item that were still waiting to be done, in the same workspace', async () => {
    repo.findInOrganisation.mockResolvedValue(fakeDocument() as never);
    await deleteEquipment('eq-1', 'org-1');
    expect(inspections.removeOpenForEquipment).toHaveBeenCalledWith('eq-1', 'org-1');
  });

  it('does not touch any inspection when the item is not found', async () => {
    repo.findInOrganisation.mockResolvedValue(null);
    await expect(deleteEquipment('eq-9', 'org-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(inspections.removeOpenForEquipment).not.toHaveBeenCalled();
  });

  it('answers 404 for something that is not there, and deletes nothing', async () => {
    repo.findInOrganisation.mockResolvedValue(null);
    await expect(deleteEquipment('eq-1', 'org-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
