import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository';
import { authenticateUser, findOrCreateGoogleUser, getOrganisationId, getUserById, registerUser } from '../services/authService';
import type { IUser } from '../models/User';

// The service is tested against a FAKE repository: these tests are about the rules, not about MongoDB.
jest.mock('../repositories/userRepository', () => ({
  userRepository: { findByEmail: jest.fn(), findByEmailWithPassword: jest.fn(), findById: jest.fn(), findByGoogleId: jest.fn(), create: jest.fn(), save: jest.fn() },
}));

const repo = userRepository as jest.Mocked<typeof userRepository>;

describe('registerUser', () => {
  beforeEach(() => {
    repo.findByEmail.mockResolvedValue(null); // nobody has this email yet
    repo.create.mockImplementation(async (data: object) => ({ ...data }) as never);
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await registerUser({ name: 'Aroha', email: 'aroha@example.com', password: 'correct-horse-battery' });
    const saved = repo.create.mock.calls[0][0] as { passwordHash: string };
    expect(saved.passwordHash).not.toBe('correct-horse-battery');
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, cost factor 12 as AGENT_RULES requires
    expect(await bcrypt.compare('correct-horse-battery', saved.passwordHash)).toBe(true);
  }, 15000);

  it('lower-cases and trims the email so "Aroha@Example.com " and "aroha@example.com" are one account', async () => {
    await registerUser({ name: ' Aroha ', email: '  Aroha@Example.COM ', password: 'correct-horse-battery' });
    expect(repo.findByEmail).toHaveBeenCalledWith('aroha@example.com');
    expect(repo.create.mock.calls[0][0]).toMatchObject({ email: 'aroha@example.com', name: 'Aroha' });
  }, 15000);

  it('creates a manager unless told otherwise', async () => {
    await registerUser({ name: 'A', email: 'a@example.com', password: 'correct-horse-battery' });
    expect(repo.create.mock.calls[0][0].role).toBe('manager');
  }, 15000);

  it('creates a staff member inside the given workspace when a manager adds them', async () => {
    await registerUser({ name: 'Tane', email: 't@example.com', password: 'correct-horse-battery' }, 'staff', 'org-1');
    expect(repo.create.mock.calls[0][0]).toMatchObject({ role: 'staff', organisationId: 'org-1' });
  }, 15000);

  it('refuses a second account with the same email (409)', async () => {
    repo.findByEmail.mockResolvedValue({ id: 'existing' } as never);
    await expect(registerUser({ name: 'A', email: 'a@example.com', password: 'correct-horse-battery' })).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe('authenticateUser', () => {
  const userWith = (passwordIsCorrect: boolean) => ({ id: 'u1', comparePassword: jest.fn().mockResolvedValue(passwordIsCorrect) });
  const lookup = (user: unknown) => repo.findByEmailWithPassword.mockResolvedValue(user as never);

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

  it('uses the lookup that includes the password hash (it is hidden by default), with the email trimmed and lower-cased', async () => {
    lookup(userWith(true));
    await authenticateUser('  A@Example.com ', 'right');
    expect(repo.findByEmailWithPassword).toHaveBeenCalledWith('a@example.com');
    expect(repo.findByEmail).not.toHaveBeenCalled();
  });
});

describe('authenticateUser: unknown email', () => {
  it('still does a real bcrypt comparison, so it is not noticeably faster than a wrong password', async () => {
    repo.findByEmailWithPassword.mockResolvedValue(null);
    const compare = jest.spyOn(bcrypt, 'compare');
    await expect(authenticateUser('nobody@example.com', 'whatever-1')).rejects.toMatchObject({ statusCode: 401 });
    expect(compare).toHaveBeenCalledTimes(1);
    compare.mockRestore();
  }, 15000);
});

describe('findOrCreateGoogleUser', () => {
  const identity = { googleId: 'g-1', email: ' Tane@Example.com ', emailVerified: true, name: 'Tane Walker' };
  beforeEach(() => {
    repo.findByGoogleId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockImplementation(async (data: object) => ({ ...data }) as never);
    repo.save.mockImplementation(async (user) => user);
  });

  it('signs in a returning Google person by their Google id, whatever the email says', async () => {
    const returning = { id: 'u1' };
    repo.findByGoogleId.mockResolvedValue(returning as never);
    await expect(findOrCreateGoogleUser({ ...identity, emailVerified: false })).resolves.toBe(returning);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates a new account with a lower-case email and no password', async () => {
    await findOrCreateGoogleUser(identity);
    expect(repo.create).toHaveBeenCalledWith({ name: 'Tane Walker', email: 'tane@example.com', googleId: 'g-1' });
  });

  it('links Google to an existing password account that uses the same verified email', async () => {
    const existing = { id: 'u1', googleId: undefined as string | undefined };
    repo.findByEmail.mockResolvedValue(existing as never);
    await findOrCreateGoogleUser(identity);
    expect(existing.googleId).toBe('g-1');
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('refuses an email Google has NOT verified (403), so nobody can take over an account by claiming its email', async () => {
    repo.findByEmail.mockResolvedValue({ id: 'u1' } as never);
    await expect(findOrCreateGoogleUser({ ...identity, emailVerified: false })).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('refuses to relink an email that already belongs to a different Google account (403)', async () => {
    repo.findByEmail.mockResolvedValue({ id: 'u1', googleId: 'someone-else' } as never);
    await expect(findOrCreateGoogleUser(identity)).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe('getUserById', () => {
  it('answers 401 if the account was deleted after the token was issued', async () => {
    repo.findById.mockResolvedValue(null);
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
