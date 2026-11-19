import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { api, getErrorMessage, isNetworkError, SESSION_EXPIRED_EVENT } from '@/services/api';

/** An error as Axios makes it when the server answered with the given status */
function serverAnswered(status: number, data: unknown = {}) {
  const config = { url: '/x' } as InternalAxiosRequestConfig;
  const response = { status, data, config, headers: {}, statusText: '' } as AxiosResponse;
  return new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response);
}
/** An error as Axios makes it when nothing came back at all (no signal) */
const noAnswer = () => new AxiosError('Network Error', 'ERR_NETWORK');

describe('isNetworkError', () => {
  it('is true when the request never got an answer (no signal, or the server is down)', () => {
    expect(isNetworkError(noAnswer())).toBe(true);
  });
  it('is false when the server answered, even with an error', () => {
    expect(isNetworkError(serverAnswered(500))).toBe(false);
  });
  it('is false for an ordinary programming error', () => {
    expect(isNetworkError(new Error('oops'))).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('uses the server\'s own plain message when there is one', () => {
    expect(getErrorMessage(serverAnswered(409, { error: 'An account with this email already exists.' }))).toBe('An account with this email already exists.');
  });
  it('says the server cannot be reached when there was no answer', () => {
    expect(getErrorMessage(noAnswer())).toBe('Cannot reach the server. Check your connection and try again.');
  });
  it('explains a 429 in plain words', () => {
    expect(getErrorMessage(serverAnswered(429))).toBe('Too many attempts. Please wait a few minutes and try again.');
  });
  it('uses the fallback when the server gave no message', () => {
    expect(getErrorMessage(serverAnswered(500, {}), 'Could not save.')).toBe('Could not save.');
  });
  it('uses the fallback for anything that is not an Axios error', () => {
    expect(getErrorMessage(new Error('internal detail that must not reach the screen'), 'Something went wrong.')).toBe('Something went wrong.');
  });
});

describe('the shared HTTP client', () => {
  /** Makes the next request fail the way the server would */
  function failWith(status: number) {
    api.defaults.adapter = async (config) => {
      throw new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, { status, data: {}, config, headers: {}, statusText: '' } as AxiosResponse);
    };
  }
  const listener = jest.fn();
  beforeEach(() => window.addEventListener(SESSION_EXPIRED_EVENT, listener));
  afterEach(() => window.removeEventListener(SESSION_EXPIRED_EVENT, listener));

  it('sends the login cookie with every request', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('announces "session expired" when a normal request comes back 401', async () => {
    failWith(401);
    await expect(api.get('/api/equipment')).rejects.toBeDefined();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it.each(['/auth/login', '/auth/register', '/auth/me'])('does NOT announce it for %s, where a 401 just means "not signed in" or "wrong password"', async (url) => {
    failWith(401);
    await expect(api.post(url)).rejects.toBeDefined();
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not announce anything for other errors, such as 403', async () => {
    failWith(403);
    await expect(api.get('/api/staff')).rejects.toBeDefined();
    expect(listener).not.toHaveBeenCalled();
  });
});
