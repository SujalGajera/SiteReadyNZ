import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../utils/jwtHelper';

describe('signToken and verifyToken', () => {
  it('puts the user id, role and workspace in the token and reads them back', () => {
    const token = signToken('user-42', 'manager', 'org-7');
    expect(verifyToken(token)).toMatchObject({ id: 'user-42', role: 'manager', orgId: 'org-7' });
  });

  it('makes a token with three dot-separated parts', () => {
    expect(signToken('u', 'staff', 'o').split('.')).toHaveLength(3);
  });

  it('sets an expiry time on the token', () => {
    const decoded = jwt.decode(signToken('u', 'staff', 'o')) as { iat: number; exp: number };
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it('rejects a token that was changed after it was signed', () => {
    const [header, payload, signature] = signToken('u', 'staff', 'o').split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ id: 'u', role: 'manager', orgId: 'o' })).toString('base64url');
    expect(() => verifyToken(`${header}.${forgedPayload}.${signature}`)).toThrow();
  });

  it('rejects a token signed with a different secret', () => {
    const stolen = jwt.sign({ id: 'u', role: 'manager', orgId: 'o' }, 'some-other-secret');
    expect(() => verifyToken(stolen)).toThrow();
  });

  it('signs with HS256, and rejects a token that uses any other algorithm even with the right secret', () => {
    const header = JSON.parse(Buffer.from(signToken('u', 'staff', 'o').split('.')[0], 'base64url').toString()) as { alg: string };
    expect(header.alg).toBe('HS256');
    const otherAlgorithm = jwt.sign({ id: 'u', role: 'manager', orgId: 'o' }, process.env.JWT_SECRET as string, { algorithm: 'HS512' });
    expect(() => verifyToken(otherAlgorithm)).toThrow(/algorithm/i);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ id: 'u', role: 'staff', orgId: 'o' }, process.env.JWT_SECRET as string, { expiresIn: -10 });
    expect(() => verifyToken(expired)).toThrow(/expired/i);
  });

  it('rejects a token with no workspace, such as one issued before workspaces existed', () => {
    const oldToken = jwt.sign({ id: 'u', role: 'manager' }, process.env.JWT_SECRET as string);
    expect(() => verifyToken(oldToken)).toThrow(/workspace/i);
  });

  it('refuses to sign anything when the secret is missing', () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      expect(() => signToken('u', 'staff', 'o')).toThrow(/JWT_SECRET/);
    } finally {
      process.env.JWT_SECRET = saved;
    }
  });
});
