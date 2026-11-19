import { createEquipment, deleteEquipment, getAllEquipment, getEquipmentById, updateEquipment } from '../controllers/equipmentController';
import * as equipmentService from '../services/equipmentService';
import { fakeNext, fakeRequest, fakeResponse, MANAGER } from './helpers';
import type { IEquipment } from '../models/Equipment';

jest.mock('../services/equipmentService');
const service = equipmentService as jest.Mocked<typeof equipmentService>;
const extinguisher = { _id: 'eq-1', name: 'Extinguisher, hall', status: 'ok' } as unknown as IEquipment;

describe('equipment controller (the five CRUD endpoints)', () => {
  it('GET all: answers 200 with the list, limited to the caller\'s workspace', async () => {
    service.listEquipment.mockResolvedValue([extinguisher]);
    const res = fakeResponse();
    await getAllEquipment(fakeRequest({ user: MANAGER }), res, fakeNext());
    expect(service.listEquipment).toHaveBeenCalledWith('org-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([extinguisher]);
  });

  it('GET one: answers 200 with the item, passing the workspace so other businesses\' items stay hidden', async () => {
    service.getEquipment.mockResolvedValue(extinguisher);
    const res = fakeResponse();
    await getEquipmentById(fakeRequest({ user: MANAGER, params: { id: 'eq-1' } }), res, fakeNext());
    expect(service.getEquipment).toHaveBeenCalledWith('eq-1', 'org-1');
    expect(res.json).toHaveBeenCalledWith(extinguisher);
  });

  it('GET one: passes a "not found" error to the error handler (which turns it into 404)', async () => {
    const notFound = Object.assign(new Error('Equipment not found.'), { statusCode: 404 });
    service.getEquipment.mockRejectedValue(notFound);
    const next = fakeNext();
    await getEquipmentById(fakeRequest({ user: MANAGER, params: { id: 'missing' } }), fakeResponse(), next);
    expect(next).toHaveBeenCalledWith(notFound);
  });

  it('POST: answers 201 and records who created it and in which workspace', async () => {
    service.createEquipment.mockResolvedValue(extinguisher);
    const res = fakeResponse();
    const body = { name: 'Extinguisher, hall', type: 'fire_extinguisher', location: 'Hall', expiryDate: '2027-01-01' };
    await createEquipment(fakeRequest({ user: MANAGER, body }), res, fakeNext());
    expect(service.createEquipment).toHaveBeenCalledWith(body, 'manager-1', 'org-1');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('PUT: answers 200 with the updated item', async () => {
    service.updateEquipment.mockResolvedValue(extinguisher);
    const res = fakeResponse();
    await updateEquipment(fakeRequest({ user: MANAGER, params: { id: 'eq-1' }, body: { location: 'Warehouse' } }), res, fakeNext());
    expect(service.updateEquipment).toHaveBeenCalledWith('eq-1', 'org-1', { location: 'Warehouse' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('DELETE: answers 204 with no body', async () => {
    service.deleteEquipment.mockResolvedValue();
    const res = fakeResponse();
    await deleteEquipment(fakeRequest({ user: MANAGER, params: { id: 'eq-1' } }), res, fakeNext());
    expect(service.deleteEquipment).toHaveBeenCalledWith('eq-1', 'org-1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('never throws out of a handler: an unexpected failure goes to next()', async () => {
    const boom = new Error('database is down');
    service.listEquipment.mockRejectedValue(boom);
    const next = fakeNext();
    await expect(getAllEquipment(fakeRequest({ user: MANAGER }), fakeResponse(), next)).resolves.toBeUndefined();
    expect(next).toHaveBeenCalledWith(boom);
  });
});
