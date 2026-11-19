import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');

const navigate = jest.fn();
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => navigate }));

const login = jest.fn();
const register = jest.fn();
beforeEach(() => {
  jest.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login, register, logout: jest.fn() });
});

const open = (page: JSX.Element, address = '/') => render(<MemoryRouter initialEntries={[address]}>{page}</MemoryRouter>);
const serverSays = (status: number, error: string) =>
  new AxiosError('x', 'ERR_BAD_REQUEST', undefined, null, { status, data: { error }, headers: {}, statusText: '', config: {} as never });

describe('Login page', () => {
  it('has visible Email and Password fields and a Google button that goes to the backend', () => {
    open(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue with Google/ })).toHaveAttribute('href', 'http://api.test/auth/google');
  });

  it('shows what is missing and sends nothing when the form is submitted empty', async () => {
    open(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('signs in with the typed (and trimmed) email and goes to the home route', async () => {
    login.mockResolvedValue({});
    open(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), '  aroha@example.com ');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('aroha@example.com', 'correct-horse'));
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('returns the person to the page they were heading for before being asked to sign in', async () => {
    login.mockResolvedValue({});
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/equipment' } }]}>
        <LoginPage />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Email'), 'a@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/equipment', { replace: true }));
  });

  it('shows the server\'s message for wrong credentials and stays on the page', async () => {
    login.mockRejectedValue(serverSays(401, 'Invalid email or password.'));
    open(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'a@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('explains Google problems that arrive in the address, in plain words', () => {
    open(<LoginPage />, '/login?error=google_unavailable');
    expect(screen.getByRole('alert')).toHaveTextContent('Google sign-in is not set up on this server yet');
  });

  it('explains a failed "state" check without exposing technical detail', () => {
    open(<LoginPage />, '/login?error=oauth_state_mismatch');
    expect(screen.getByRole('alert')).toHaveTextContent('expired or looked suspicious');
  });
});

describe('Register page', () => {
  it('asks for name, email and password only: there is no role to choose', () => {
    open(<RegisterPage />);
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByText(/Staff/)).not.toBeInTheDocument();
    expect(screen.getByText(/You will be the manager/)).toBeInTheDocument();
  });

  it('rejects a 7-character password while typing, and accepts 8', async () => {
    open(<RegisterPage />);
    const password = screen.getByLabelText('Password');
    await userEvent.type(password, '1234567');
    await userEvent.tab();
    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument();
    await userEvent.type(password, '8');
    await waitFor(() => expect(screen.queryByText('Use at least 8 characters')).not.toBeInTheDocument());
  });

  it('creates the account with exactly name, email and password', async () => {
    register.mockResolvedValue({});
    open(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Full name'), 'Aroha Ngata');
    await userEvent.type(screen.getByLabelText('Work email'), 'aroha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(register).toHaveBeenCalledWith({ name: 'Aroha Ngata', email: 'aroha@example.com', password: 'correct-horse-battery' }));
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows "already exists" when the email is taken', async () => {
    register.mockRejectedValue(serverSays(409, 'An account with this email already exists.'));
    open(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Full name'), 'A');
    await userEvent.type(screen.getByLabelText('Work email'), 'a@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });
});
