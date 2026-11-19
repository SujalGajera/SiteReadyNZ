import { getCurrentUser, googleCallback, login, logout, register } from '../controllers/authController';
import * as authService from '../services/authService';
import { verifyToken } from '../utils/jwtHelper';
import { AUTH_COOKIE_NAME } from '../utils/authCookie';
import { fakeNext, fakeRequest, fakeResponse } from './helpers';
import type { IUser } from '../models/User';

jest.mock('../services/authService');
jest.mock('../config/logger', () => ({ __esModule: true, default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn() } }));

const service = authService as jest.Mocked<typeof authService>;
const aroha = { id: 'user-1', role: 'manager', name: 'Aroha' } as unknown as IUser;

beforeEach(() => {
  service.getOrganisationId.mockReturnValue('org-1');
});

describe('register', () => {
  it('answers 201 with the user and a token, and sets the login cookie', async () => {
    service.registerUser.mockResolvedValue(aroha);
    const res = fakeResponse();
    await register(fakeRequest({ body: { name: 'Aroha', email: 'a@example.com', password: 'correct-horse-battery' } }), res, fakeNext());

    expect(res.status).toHaveBeenCalledWith(201);
    const sent = res.json.mock.calls[0][0] as { token: string; user: IUser };
    expect(sent.user).toBe(aroha);
    expect(verifyToken(sent.token)).toMatchObject({ id: 'user-1', role: 'manager', orgId: 'org-1' });
    expect(res.cookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, sent.token, expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
  });

  it('never lets the request choose the role: only name, email and password reach the service', async () => {
    service.registerUser.mockResolvedValue(aroha);
    await register(fakeRequest({ body: { name: 'Sneaky', email: 's@example.com', password: 'correct-horse-battery', role: 'admin' } }), fakeResponse(), fakeNext());
    // The role argument (2nd) is never supplied, so the service uses its default: manager
    expect(service.registerUser.mock.calls[0]).toHaveLength(1);
  });

  it('hands a service error (such as a duplicate email) to the error handler instead of crashing', async () => {
    const duplicate = Object.assign(new Error('An account with this email already exists.'), { statusCode: 409 });
    service.registerUser.mockRejectedValue(duplicate);
    const next = fakeNext();
    await register(fakeRequest({ body: {} }), fakeResponse(), next);
    expect(next).toHaveBeenCalledWith(duplicate);
  });
});

describe('login', () => {
  it('answers 200 with a token and sets the cookie when the credentials are right', async () => {
    service.authenticateUser.mockResolvedValue(aroha);
    const res = fakeResponse();
    await login(fakeRequest({ body: { email: 'a@example.com', password: 'right' } }), res, fakeNext());
    expect(service.authenticateUser).toHaveBeenCalledWith('a@example.com', 'right');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledTimes(1);
  });

  it('sets no cookie when the credentials are wrong, and passes the 401 on', async () => {
    const unauthorised = Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
    service.authenticateUser.mockRejectedValue(unauthorised);
    const res = fakeResponse();
    const next = fakeNext();
    await login(fakeRequest({ body: { email: 'a@example.com', password: 'wrong' } }), res, next);
    expect(next).toHaveBeenCalledWith(unauthorised);
    expect(res.cookie).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('removes the login cookie and answers 204 with no body', () => {
    const res = fakeResponse();
    logout(fakeRequest(), res);
    expect(res.clearCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('getCurrentUser', () => {
  it('looks the person up by the id in their token and answers 200', async () => {
    service.getUserById.mockResolvedValue(aroha);
    const res = fakeResponse();
    await getCurrentUser(fakeRequest({ user: { id: 'user-1', role: 'manager', orgId: 'org-1' } }), res, fakeNext());
    expect(service.getUserById).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({ user: aroha });
  });
});

describe('googleCallback', () => {
  it('starts a session and sends the browser back to the app, with no token in the address', () => {
    const res = fakeResponse();
    googleCallback(fakeRequest({ user: aroha as unknown as { id: string; role: string; orgId: string } }), res);
    expect(res.cookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, expect.any(String), expect.objectContaining({ httpOnly: true }));
    const target = res.redirect.mock.calls[0][0] as string;
    expect(target).toBe('http://localhost:5173/');
    expect(target).not.toMatch(/token|eyJ/);
  });

  it('sends the person back to the login page with an error when Google gave us nobody', () => {
    const res = fakeResponse();
    googleCallback(fakeRequest(), res);
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=oauth_failed');
    expect(res.cookie).not.toHaveBeenCalled();
  });
});
