import bcrypt from 'bcryptjs';
import User from '../models/User';
import { authenticateUser, getOrganisationId, getUserById, registerUser } from '../services/authService';
import type { IUser } from '../models/User';

jest.mock('../models/User', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findById: jest.fn(), create: jest.fn() },
}));

const mockedUser = User as unknown as { findOne: jest.Mock; findById: jest.Mock; create: jest.Mock };

describe('registerUser', () => {
  beforeEach(() => {
    mockedUser.findOne.mockResolvedValue(null); // nobody has this email yet
    mockedUser.create.mockImplementation(async (data: object) => ({ ...data }));
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await registerUser({ name: 'Aroha', email: 'aroha@example.com', password: 'correct-horse-battery' });
    const saved = mockedUser.create.mock.calls[0][0];
    expect(saved.passwordHash).not.toBe('correct-horse-battery');
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, cost factor 12 as AGENT_RULES requires
    expect(await bcrypt.compare('correct-horse-battery', saved.passwordHash)).toBe(true);
  }, 15000);

  it('lower-cases and trims the email so "Aroha@Example.com " and "aroha@example.com" are one account', async () => {
    await registerUser({ name: ' Aroha ', email: '  Aroha@Example.COM ', password: 'correct-horse-battery' });
    expect(mockedUser.findOne).toHaveBeenCalledWith({ email: 'aroha@example.com' });
    expect(mockedUser.create.mock.calls[0][0]).toMatchObject({ email: 'aroha@example.com', name: 'Aroha' });
  }, 15000);

  it('creates a manager unless told otherwise', async () => {
    await registerUser({ name: 'A', email: 'a@example.com', password: 'correct-horse-battery' });
    expect(mockedUser.create.mock.calls[0][0].role).toBe('manager');
  }, 15000);

  it('creates a staff member inside the given workspace when a manager adds them', async () => {
    await registerUser({ name: 'Tane', email: 't@example.com', password: 'correct-horse-battery' }, 'staff', 'org-1');
    expect(mockedUser.create.mock.calls[0][0]).toMatchObject({ role: 'staff', organisationId: 'org-1' });
  }, 15000);

  it('refuses a second account with the same email (409)', async () => {
    mockedUser.findOne.mockResolvedValue({ id: 'existing' });
    await expect(registerUser({ name: 'A', email: 'a@example.com', password: 'correct-horse-battery' })).rejects.toMatchObject({ statusCode: 409 });
    expect(mockedUser.create).not.toHaveBeenCalled();
  });
});

describe('authenticateUser', () => {
  const userWith = (passwordIsCorrect: boolean) => ({ id: 'u1', comparePassword: jest.fn().mockResolvedValue(passwordIsCorrect) });
  const lookup = (user: unknown) => mockedUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

  it('returns the user when the password is right', async () => {
    const user = userWith(true);
    lookup(user);
    await expect(authenticateUser('a@example.com', 'right')).resolves.toBe(user);
  });

  it('answers 401 for a wrong password', async () => {
    lookup(userWith(false));
    await expect(authenticateUser('a@example.com', 'wrong')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('gives the SAME message for an unknown email as for a wrong password, so attackers cannot find out which emails exist', async () => {
    lookup(userWith(false));
    const wrongPassword = await authenticateUser('a@example.com', 'wrong').catch((error: Error) => error.message);
    lookup(null);
    const unknownEmail = await authenticateUser('nobody@example.com', 'whatever').catch((error: Error) => error.message);
    expect(unknownEmail).toBe(wrongPassword);
  });

  it('asks the database for the password hash explicitly, because it is hidden by default', async () => {
    const select = jest.fn().mockResolvedValue(userWith(true));
    mockedUser.findOne.mockReturnValue({ select });
    await authenticateUser('a@example.com', 'right');
    expect(select).toHaveBeenCalledWith('+passwordHash');
  });
});

describe('getUserById', () => {
  it('answers 401 if the account was deleted after the token was issued', async () => {
    mockedUser.findById.mockResolvedValue(null);
    await expect(getUserById('gone')).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('getOrganisationId', () => {
  it('uses the stored workspace id', () => {
    expect(getOrganisationId({ _id: 'u1', organisationId: 'org-5' } as unknown as IUser)).toBe('org-5');
  });

  it('falls back to the person\'s own id for accounts made before workspaces existed', () => {
    expect(getOrganisationId({ _id: 'u1' } as unknown as IUser)).toBe('u1');
  });
});
