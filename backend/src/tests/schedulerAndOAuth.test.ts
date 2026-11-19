import { body } from 'express-validator';
import { startNotificationScheduler } from '../jobs/notificationScheduler';
import { runNotificationSweep } from '../services/notificationService';
import { completeGoogleSignIn, startGoogleSignIn, verifyGoogleState } from '../middleware/googleOAuth';
import { rejectIfInvalid } from '../utils/validation';
import { OAUTH_STATE_COOKIE_NAME } from '../utils/authCookie';
import logger from '../config/logger';
import { fakeNext, fakeRequest, fakeResponse } from './helpers';

jest.mock('../services/notificationService');
jest.mock('../config/logger', () => ({ __esModule: true, default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn() } }));

let mockGoogleConfigured = true;
const mockAuthenticate = jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next());
jest.mock('../config/passport', () => ({
  __esModule: true,
  default: { authenticate: (...args: unknown[]) => (mockAuthenticate as unknown as (...a: unknown[]) => unknown)(...args) },
  get isGoogleAuthConfigured() {
    return mockGoogleConfigured;
  },
}));

describe('notification scheduler', () => {
  const sweep = jest.mocked(runNotificationSweep);
  beforeEach(() => {
    jest.useFakeTimers();
    sweep.mockResolvedValue({ reminders: 0, lateAlerts: 0 });
    delete process.env.NOTIFICATION_SWEEP_MINUTES;
  });
  afterEach(() => jest.useRealTimers());

  it('checks straight away when the server starts, then every 15 minutes', async () => {
    const stop = startNotificationScheduler();
    expect(sweep).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(14 * 60 * 1000);
    expect(sweep).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(60 * 1000);
    expect(sweep).toHaveBeenCalledTimes(2);
    stop();
  });

  it('follows NOTIFICATION_SWEEP_MINUTES when it is set', async () => {
    process.env.NOTIFICATION_SWEEP_MINUTES = '5';
    const stop = startNotificationScheduler();
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(sweep).toHaveBeenCalledTimes(2);
    stop();
  });

  it('stops when told to', async () => {
    const stop = startNotificationScheduler();
    stop();
    await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(sweep).toHaveBeenCalledTimes(1);
  });

  it('logs a failed check and carries on instead of crashing the server', async () => {
    sweep.mockRejectedValueOnce(new Error('database is down'));
    const stop = startNotificationScheduler();
    await jest.advanceTimersByTimeAsync(0);
    expect(logger.error).toHaveBeenCalledWith('Notification sweep failed', expect.objectContaining({ message: 'database is down' }));
    await jest.advanceTimersByTimeAsync(15 * 60 * 1000);
    expect(sweep).toHaveBeenCalledTimes(2); // tried again next time
    stop();
  });

  it('logs when notifications were sent, and stays quiet when there was nothing to send', async () => {
    sweep.mockResolvedValueOnce({ reminders: 2, lateAlerts: 1 });
    const stop = startNotificationScheduler();
    await jest.advanceTimersByTimeAsync(0);
    expect(logger.info).toHaveBeenCalledWith('Notifications sent: 2 reminder(s), 1 late alert(s)');
    stop();
  });
});

describe('Google sign-in safety checks (OAuth "state")', () => {
  beforeEach(() => {
    mockGoogleConfigured = true;
  });

  it('starts by sending the person back to login with a clear reason when Google keys are not set', () => {
    mockGoogleConfigured = false;
    const res = fakeResponse();
    startGoogleSignIn(fakeRequest(), res, fakeNext());
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=google_unavailable');
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it('makes a random one-time "state", keeps a copy in a cookie, and gives Google the other copy', () => {
    const res = fakeResponse();
    startGoogleSignIn(fakeRequest(), res, fakeNext());
    const [, cookieValue] = res.cookie.mock.calls[0] as [string, string];
    expect(res.cookie.mock.calls[0][0]).toBe(OAUTH_STATE_COOKIE_NAME);
    expect(cookieValue).toMatch(/^[0-9a-f]{48}$/);
    expect(mockAuthenticate).toHaveBeenCalledWith('google', expect.objectContaining({ state: cookieValue, session: false }));
  });

  it('lets the callback through when Google returns the same state we issued', () => {
    const next = fakeNext();
    verifyGoogleState(fakeRequest({ cookies: { [OAUTH_STATE_COOKIE_NAME]: 'abc123' }, query: { state: 'abc123' } }), fakeResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a different state (someone is trying to log you into their account)', { cookies: { [OAUTH_STATE_COOKIE_NAME]: 'abc123' }, query: { state: 'forged' } }],
    ['no state in the address', { cookies: { [OAUTH_STATE_COOKIE_NAME]: 'abc123' }, query: {} }],
    ['no state cookie (the sign-in did not start here)', { cookies: {}, query: { state: 'abc123' } }],
  ])('rejects the callback with %s', (_name, request) => {
    const res = fakeResponse();
    const next = fakeNext();
    verifyGoogleState(fakeRequest(request), res, next);
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=oauth_state_mismatch');
    expect(next).not.toHaveBeenCalled();
  });

  it('uses the state only once: the cookie is cleared whatever the outcome', () => {
    const res = fakeResponse();
    verifyGoogleState(fakeRequest({ cookies: { [OAUTH_STATE_COOKIE_NAME]: 'abc123' }, query: { state: 'abc123' } }), res, fakeNext());
    expect(res.clearCookie).toHaveBeenCalledWith(OAUTH_STATE_COOKIE_NAME, expect.any(Object));
  });

  it('hands over to Passport to finish the sign-in, or explains if Google is not set up', () => {
    completeGoogleSignIn(fakeRequest(), fakeResponse(), fakeNext());
    expect(mockAuthenticate).toHaveBeenCalledWith('google', expect.objectContaining({ session: false, failureRedirect: 'http://localhost:5173/login?error=oauth_failed' }));

    mockGoogleConfigured = false;
    const res = fakeResponse();
    completeGoogleSignIn(fakeRequest(), res, fakeNext());
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=google_unavailable');
  });
});

describe('rejectIfInvalid (shared by every validated route)', () => {
  it('answers 400 with one readable sentence plus the detail for each field, and tells the caller to stop', async () => {
    const req = fakeRequest({ body: { email: 'nope', name: '' } });
    await body('email').isEmail().withMessage('A valid email address is required').run(req);
    await body('name').notEmpty().withMessage('Name is required').run(req);
    const res = fakeResponse();
    expect(rejectIfInvalid(req, res)).toBe(true);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'A valid email address is required',
      errors: [
        { field: 'email', message: 'A valid email address is required' },
        { field: 'name', message: 'Name is required' },
      ],
    });
  });

  it('does nothing and returns false when everything is valid', async () => {
    const req = fakeRequest({ body: { email: 'a@example.com' } });
    await body('email').isEmail().run(req);
    const res = fakeResponse();
    expect(rejectIfInvalid(req, res)).toBe(false);
    expect(res.status).not.toHaveBeenCalled();
  });
});
