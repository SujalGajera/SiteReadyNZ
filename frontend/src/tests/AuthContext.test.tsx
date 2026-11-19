import { act, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { api, SESSION_EXPIRED_EVENT } from '@/services/api';
import { clearCachedInspections } from '@/services/offlineDb';
import { detachDeviceFromCurrentUser } from '@/services/pushClient';
import { AxiosError } from 'axios';
import type { User } from '@/types';

jest.mock('@/services/api', () => ({
  ...jest.requireActual('@/services/api'),
  api: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('@/services/offlineDb', () => ({ clearCachedInspections: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/services/pushClient', () => ({ detachDeviceFromCurrentUser: jest.fn().mockResolvedValue(undefined) }));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;
const aroha: User = { id: 'u1', name: 'Aroha Ngata', email: 'aroha@example.com', role: 'manager' };

/** Shows what the context says, and has buttons to use it */
function Probe() {
  const { user, isLoading, login, register, logout } = useAuth();
  return (
    <div>
      <p data-testid="state">{isLoading ? 'loading' : user ? `signed in as ${user.name} (${user.role})` : 'signed out'}</p>
      <button onClick={() => void login('aroha@example.com', 'pw')}>login</button>
      <button onClick={() => void register({ name: 'Aroha Ngata', email: 'aroha@example.com', password: 'pw' })}>register</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}
const mount = () => render(<AuthProvider><Probe /></AuthProvider>);
const state = () => screen.getByTestId('state').textContent;
const noSession = () => get.mockRejectedValue(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, null, { status: 401, data: {}, headers: {}, statusText: '', config: {} as never }));

beforeEach(() => {
  localStorage.clear();
});

describe('AuthProvider: restoring the session on page load', () => {
  it('starts as "loading" so route guards do not flash the login page', () => {
    get.mockReturnValue(new Promise(() => undefined)); // never answers
    mount();
    expect(state()).toBe('loading');
  });

  it('signs the person in when the server recognises their cookie, and keeps a copy of their profile', async () => {
    get.mockResolvedValue({ data: { user: aroha } });
    mount();
    await waitFor(() => expect(state()).toBe('signed in as Aroha Ngata (manager)'));
    expect(get).toHaveBeenCalledWith('/auth/me');
    expect(JSON.parse(localStorage.getItem('siteready_user') as string)).toEqual(aroha);
    expect(localStorage.getItem('siteready_user')).not.toMatch(/token|eyJ/); // never the login token
  });

  it('signs the person out and forgets the cached profile when the server says no (401)', async () => {
    localStorage.setItem('siteready_user', JSON.stringify(aroha));
    noSession();
    mount();
    await waitFor(() => expect(state()).toBe('signed out'));
    expect(localStorage.getItem('siteready_user')).toBeNull();
  });

  it('keeps an offline worker signed in from the cached profile when the server cannot be reached', async () => {
    localStorage.setItem('siteready_user', JSON.stringify(aroha));
    get.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    mount();
    await waitFor(() => expect(state()).toBe('signed in as Aroha Ngata (manager)'));
  });

  it('is signed out when offline with no cached profile', async () => {
    get.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    mount();
    await waitFor(() => expect(state()).toBe('signed out'));
  });

  it('treats a damaged cached profile as signed out instead of crashing', async () => {
    localStorage.setItem('siteready_user', '{not json');
    get.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    mount();
    await waitFor(() => expect(state()).toBe('signed out'));
  });
});

describe('AuthProvider: actions', () => {
  beforeEach(() => noSession());

  it('login posts the credentials and signs the person in', async () => {
    post.mockResolvedValue({ data: { user: aroha } });
    mount();
    await waitFor(() => expect(state()).toBe('signed out'));
    await act(async () => screen.getByText('login').click());
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'aroha@example.com', password: 'pw' });
    expect(state()).toBe('signed in as Aroha Ngata (manager)');
  });

  it('register sends name, email and password only, so the person cannot pick a role', async () => {
    post.mockResolvedValue({ data: { user: aroha } });
    mount();
    await waitFor(() => expect(state()).toBe('signed out'));
    await act(async () => screen.getByText('register').click());
    expect(post).toHaveBeenCalledWith('/auth/register', { name: 'Aroha Ngata', email: 'aroha@example.com', password: 'pw' });
  });

  it('logout detaches the phone from this person\'s alerts first, then ends the session and clears saved task lists', async () => {
    get.mockResolvedValue({ data: { user: aroha } });
    post.mockResolvedValue({});
    mount();
    await waitFor(() => expect(state()).toContain('signed in'));
    await act(async () => screen.getByText('logout').click());
    expect(detachDeviceFromCurrentUser).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/auth/logout');
    expect(clearCachedInspections).toHaveBeenCalledTimes(1);
    expect(state()).toBe('signed out');
    expect(localStorage.getItem('siteready_user')).toBeNull();
  });

  it('logout still signs the person out on this device when the server cannot be reached', async () => {
    get.mockResolvedValue({ data: { user: aroha } });
    post.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    mount();
    await waitFor(() => expect(state()).toContain('signed in'));
    await act(async () => screen.getByText('logout').click());
    expect(state()).toBe('signed out');
  });

  it('signs out when any request reports an expired session', async () => {
    get.mockResolvedValue({ data: { user: aroha } });
    mount();
    await waitFor(() => expect(state()).toContain('signed in'));
    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });
    expect(state()).toBe('signed out');
  });
});
