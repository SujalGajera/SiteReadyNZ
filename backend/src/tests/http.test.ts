// HTTP-level tests: real requests go through the real Express app (headers, JSON parsing, rate limit,
// login check, role check, validators, controllers, error handler). Only the services are faked, so no
// database is needed. These check the things unit tests of single functions cannot: that the pieces are
// wired together in the right order.

import request from 'supertest';
import app from '../app';
import { signToken } from '../utils/jwtHelper';
import * as authService from '../services/authService';
import * as equipmentService from '../services/equipmentService';
import * as inspectionService from '../services/inspectionService';
import * as staffService from '../services/staffService';

jest.mock('../services/authService');
jest.mock('../services/equipmentService');
jest.mock('../services/inspectionService');
jest.mock('../services/staffService');

const auth = jest.mocked(authService);
const equipment = jest.mocked(equipmentService);
const inspections = jest.mocked(inspectionService);
const staff = jest.mocked(staffService);

const managerToken = signToken('64b000000000000000000001', 'manager', '64b000000000000000000001');
const staffToken = signToken('64b000000000000000000002', 'staff', '64b000000000000000000001');
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const VALID_ID = '64b0000000000000000000aa';

describe('security headers and login check', () => {
  it('sends the standard protective headers and hides that the server runs Express', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('answers 401 with a JSON error when there is no token', async () => {
    const res = await request(app).get('/api/equipment');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('answers 401 for a token signed with the wrong secret', async () => {
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJyb2xlIjoibWFuYWdlciIsIm9yZ0lkIjoiMSJ9.not-a-real-signature';
    expect((await request(app).get('/api/equipment').set(bearer(forged))).status).toBe(401);
  });

  it('answers 401 for a token with no signature at all ("alg: none")', async () => {
    const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"id":"1","role":"manager","orgId":"1"}').toString('base64url')}.`;
    expect((await request(app).get('/api/equipment').set(bearer(unsigned))).status).toBe(401);
  });

  it('answers 403 when a staff member calls a manager-only route', async () => {
    const res = await request(app).post('/api/equipment').set(bearer(staffToken)).send({ name: 'AED', type: 'aed', location: 'Hall', expiryDate: '2030-01-01' });
    expect(res.status).toBe(403);
    expect(equipment.createEquipment).not.toHaveBeenCalled();
  });
});

describe('NoSQL injection and wrong-type input is refused with 400, never a 500', () => {
  it.each([
    ['an operator object as the email', { email: { $gt: '' }, password: 'whatever-1' }],
    ['an array as the email', { email: ['a@example.com'], password: 'whatever-1' }],
    ['an operator object as the password', { email: 'a@example.com', password: { $gt: '' } }],
    ['a number as the password', { email: 'a@example.com', password: 12345678 }],
  ])('login with %s', async (_label, body) => {
    const res = await request(app).post('/auth/login').send(body);
    expect(res.status).toBe(400);
    expect(auth.authenticateUser).not.toHaveBeenCalled();
  });

  it('register with an object as the name', async () => {
    const res = await request(app).post('/auth/register').send({ name: { $ne: 1 }, email: 'a@example.com', password: 'correct-horse-battery' });
    expect(res.status).toBe(400);
    expect(auth.registerUser).not.toHaveBeenCalled();
  });

  it('creating equipment with an object as the name', async () => {
    const res = await request(app).post('/api/equipment').set(bearer(managerToken)).send({ name: { $gt: '' }, type: 'aed', location: 'Hall', expiryDate: '2030-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('name');
    expect(equipment.createEquipment).not.toHaveBeenCalled();
  });

  it('creating equipment with an operator object as the type', async () => {
    const res = await request(app).post('/api/equipment').set(bearer(managerToken)).send({ name: 'AED', type: { $ne: 'aed' }, location: 'Hall', expiryDate: '2030-01-01' });
    expect(res.status).toBe(400);
  });

  it('adding staff with an array as the email', async () => {
    const res = await request(app).post('/api/staff').set(bearer(managerToken)).send({ name: 'Tane', email: ['t@example.com'], password: 'correct-horse-battery' });
    expect(res.status).toBe(400);
    expect(staff.createStaff).not.toHaveBeenCalled();
  });

  it('a push message with an object as the title', async () => {
    const res = await request(app).post('/api/push/send').set(bearer(managerToken)).send({ targetUserId: VALID_ID, title: { $ne: null }, body: 'Hello' });
    expect(res.status).toBe(400);
  });

  it('answers malformed JSON with 400 and a JSON error', async () => {
    const res = await request(app).post('/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('a valid login still goes through to the service', async () => {
    auth.authenticateUser.mockResolvedValue({ _id: VALID_ID, role: 'manager', toJSON: () => ({ id: VALID_ID }) } as never);
    auth.getOrganisationId.mockReturnValue(VALID_ID);
    const res = await request(app).post('/auth/login').send({ email: 'a@example.com', password: 'correct-horse-battery' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });
});

describe('equipment CRUD status codes', () => {
  it('create answers 201, read 200, update 200, delete 204 with no body', async () => {
    equipment.createEquipment.mockResolvedValue({ _id: VALID_ID, name: 'AED' } as never);
    equipment.getEquipment.mockResolvedValue({ _id: VALID_ID, name: 'AED' } as never);
    equipment.updateEquipment.mockResolvedValue({ _id: VALID_ID, name: 'AED 2' } as never);
    equipment.deleteEquipment.mockResolvedValue();

    const created = await request(app).post('/api/equipment').set(bearer(managerToken)).send({ name: 'AED', type: 'aed', location: 'Hall', expiryDate: '2030-01-01' });
    expect(created.status).toBe(201);
    expect((await request(app).get(`/api/equipment/${VALID_ID}`).set(bearer(staffToken))).status).toBe(200);
    expect((await request(app).put(`/api/equipment/${VALID_ID}`).set(bearer(managerToken)).send({ name: 'AED 2' })).status).toBe(200);
    const deleted = await request(app).delete(`/api/equipment/${VALID_ID}`).set(bearer(managerToken));
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');
  });

  it('answers 400 for an id that is not a valid MongoDB id', async () => {
    expect((await request(app).get('/api/equipment/not-an-id').set(bearer(managerToken))).status).toBe(400);
  });

  it('answers 404 when the service says the item is not in the workspace', async () => {
    equipment.getEquipment.mockRejectedValue(Object.assign(new Error('Equipment not found.'), { statusCode: 404 }));
    const res = await request(app).get(`/api/equipment/${VALID_ID}`).set(bearer(managerToken));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Equipment not found.' });
  });

  it('answers 500 with a generic message (never the real error) for an unexpected fault', async () => {
    equipment.listEquipment.mockRejectedValue(new Error('connection string mongodb://secret leaked'));
    const res = await request(app).get('/api/equipment').set(bearer(managerToken));
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});

describe('DELETE /api/inspections/:id', () => {
  it('answers 204 for a manager and passes the id and the workspace to the service', async () => {
    inspections.deleteInspection.mockResolvedValue();
    const res = await request(app).delete(`/api/inspections/${VALID_ID}`).set(bearer(managerToken));
    expect(res.status).toBe(204);
    expect(inspections.deleteInspection).toHaveBeenCalledWith(VALID_ID, expect.objectContaining({ role: 'manager', orgId: '64b000000000000000000001' }));
  });

  it('answers 403 for a staff member and deletes nothing', async () => {
    const res = await request(app).delete(`/api/inspections/${VALID_ID}`).set(bearer(staffToken));
    expect(res.status).toBe(403);
    expect(inspections.deleteInspection).not.toHaveBeenCalled();
  });

  it('answers 401 with no token', async () => {
    expect((await request(app).delete(`/api/inspections/${VALID_ID}`)).status).toBe(401);
  });

  it('answers 400 for an id that is not a valid MongoDB id', async () => {
    expect((await request(app).delete('/api/inspections/not-an-id').set(bearer(managerToken))).status).toBe(400);
  });

  it('answers 409 for a completed inspection and 404 for one that is not there', async () => {
    inspections.deleteInspection.mockRejectedValueOnce(Object.assign(new Error('A completed inspection is kept as a record and cannot be deleted.'), { statusCode: 409 }));
    expect((await request(app).delete(`/api/inspections/${VALID_ID}`).set(bearer(managerToken))).status).toBe(409);
    inspections.deleteInspection.mockRejectedValueOnce(Object.assign(new Error('Inspection not found.'), { statusCode: 404 }));
    expect((await request(app).delete(`/api/inspections/${VALID_ID}`).set(bearer(managerToken))).status).toBe(404);
  });
});
