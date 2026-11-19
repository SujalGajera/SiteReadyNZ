import { requireAuthentication } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import { signToken } from '../utils/jwtHelper';
import { AUTH_COOKIE_NAME } from '../utils/authCookie';
import { fakeNext, fakeRequest, fakeResponse, MANAGER, STAFF } from './helpers';

describe('requireAuthentication', () => {
  it('lets a request through when the login cookie holds a valid token, and attaches who it is', () => {
    const req = fakeRequest({ cookies: { [AUTH_COOKIE_NAME]: signToken('user-1', 'manager', 'org-1') } });
    const next = fakeNext();
    requireAuthentication(req, fakeResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 'user-1', role: 'manager', orgId: 'org-1' });
  });

  it('also accepts "Authorization: Bearer <token>", which is what Postman sends', () => {
    const token = signToken('user-2', 'staff', 'org-9');
    const req = fakeRequest({ headers: { authorization: `Bearer ${token}` } });
    const next = fakeNext();
    requireAuthentication(req, fakeResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user?.orgId).toBe('org-9');
  });

  it('answers 401 when there is no token at all, without calling the next step', () => {
    const res = fakeResponse();
    const next = fakeNext();
    requireAuthentication(fakeRequest(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('answers 401 for a forged token', () => {
    const res = fakeResponse();
    const next = fakeNext();
    requireAuthentication(fakeRequest({ headers: { authorization: 'Bearer abc.def.ghi' } }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('ignores an Authorization header that is not a Bearer token', () => {
    const res = fakeResponse();
    requireAuthentication(fakeRequest({ headers: { authorization: 'Basic dXNlcjpwYXNz' } }), res, fakeNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('requireRole', () => {
  it('lets a manager through a manager-only route', () => {
    const next = fakeNext();
    requireRole('manager')(fakeRequest({ user: MANAGER }), fakeResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('answers 403 (not 401) to a signed-in staff member, and says which role is needed', () => {
    const res = fakeResponse();
    const next = fakeNext();
    requireRole('manager')(fakeRequest({ user: STAFF }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining("'manager'") });
    expect(next).not.toHaveBeenCalled();
  });

  it('answers 401 if it was wired in before authentication (nobody is signed in)', () => {
    const res = fakeResponse();
    requireRole('manager')(fakeRequest(), res, fakeNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
