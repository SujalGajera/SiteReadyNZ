import Equipment from '../models/Equipment';
import { createEquipment, deleteEquipment, getEquipment, listEquipment, updateEquipment } from '../services/equipmentService';

jest.mock('../models/Equipment', () => ({
  __esModule: true,
  default: { find: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}));

const model = Equipment as unknown as { find: jest.Mock; findOne: jest.Mock; create: jest.Mock };

/** A stand-in for a Mongoose document that records what was set on it */
function fakeDocument() {
  const doc = {
    set: jest.fn(),
    save: jest.fn(),
    deleteOne: jest.fn().mockResolvedValue(undefined),
  };
  doc.save.mockResolvedValue(doc);
  return doc;
}

/** Mongoose queries can be chained (.populate().sort()); this fakes that and resolves at the end */
function chainable<T>(result: T) {
  const chain = { populate: jest.fn(), sort: jest.fn() };
  chain.populate.mockReturnValue(chain);
  chain.sort.mockResolvedValue(result);
  return chain;
}

describe('listEquipment', () => {
  it('only asks for the caller\'s workspace, soonest expiry first', async () => {
    const chain = chainable([]);
    model.find.mockReturnValue(chain);
    await listEquipment('org-1');
    expect(model.find).toHaveBeenCalledWith({ organisationId: 'org-1' });
    expect(chain.sort).toHaveBeenCalledWith({ expiryDate: 1 });
  });
});

describe('getEquipment', () => {
  it('looks for the id AND the workspace, so another business\'s item can never be read', async () => {
    model.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: 'eq-1' }) });
    await getEquipment('eq-1', 'org-1');
    expect(model.findOne).toHaveBeenCalledWith({ _id: 'eq-1', organisationId: 'org-1' });
  });

  it('answers 404 for an item that does not exist, or belongs to someone else', async () => {
    model.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    await expect(getEquipment('eq-1', 'org-2')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('createEquipment', () => {
  it('records the creating manager and the workspace', async () => {
    model.create.mockResolvedValue({});
    await createEquipment({ name: 'AED', type: 'aed', location: 'Hall', expiryDate: '2027-01-01' }, 'manager-1', 'org-1');
    expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ assignedManagerId: 'manager-1', organisationId: 'org-1', name: 'AED' }));
  });

  it('ignores fields a client should never set: status, _id and organisationId', async () => {
    model.create.mockResolvedValue({});
    const sneaky = { name: 'AED', type: 'aed', location: 'Hall', expiryDate: '2027-01-01', status: 'ok', _id: 'forced-id', organisationId: 'someone-elses' };
    await createEquipment(sneaky as never, 'manager-1', 'org-1');
    const saved = model.create.mock.calls[0][0];
    expect(saved).not.toHaveProperty('status');
    expect(saved).not.toHaveProperty('_id');
    expect(saved.organisationId).toBe('org-1'); // the server's value wins
  });

  it('turns a blank serial number into "not set" instead of saving an empty string', async () => {
    model.create.mockResolvedValue({});
    await createEquipment({ name: 'AED', type: 'aed', location: 'Hall', expiryDate: '2027-01-01', serialNumber: '' }, 'm', 'o');
    expect(model.create.mock.calls[0][0].serialNumber).toBeUndefined();
  });
});

describe('updateEquipment', () => {
  it('changes only the allowed fields, and saves through save() so the status is recalculated', async () => {
    const doc = fakeDocument();
    model.findOne.mockResolvedValue(doc);
    await updateEquipment('eq-1', 'org-1', { location: 'Warehouse', status: 'ok', organisationId: 'hijack' } as never);
    expect(doc.set).toHaveBeenCalledWith({ location: 'Warehouse' });
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('can clear the serial number with a blank value', async () => {
    const doc = fakeDocument();
    model.findOne.mockResolvedValue(doc);
    await updateEquipment('eq-1', 'org-1', { serialNumber: '' });
    expect(doc.set).toHaveBeenCalledWith({ serialNumber: undefined });
  });

  it('answers 404 and saves nothing when the item is not in the workspace', async () => {
    model.findOne.mockResolvedValue(null);
    await expect(updateEquipment('eq-1', 'org-2', { name: 'x' })).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deleteEquipment', () => {
  it('deletes the item found in the caller\'s workspace', async () => {
    const doc = fakeDocument();
    model.findOne.mockResolvedValue(doc);
    await deleteEquipment('eq-1', 'org-1');
    expect(model.findOne).toHaveBeenCalledWith({ _id: 'eq-1', organisationId: 'org-1' });
    expect(doc.deleteOne).toHaveBeenCalledTimes(1);
  });

  it('answers 404 for something that is not there', async () => {
    model.findOne.mockResolvedValue(null);
    await expect(deleteEquipment('eq-1', 'org-1')).rejects.toMatchObject({ statusCode: 404 });
  });
});
