import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateChoice,
  validateEmail,
  validateExpiryAfterPurchase,
  validateName,
  validateNewPassword,
  validateOptionalDate,
  validateOptionalText,
  validatePasswordPresent,
  validateRequiredDate,
  validateRequiredText,
} from '@/utils/validators';

describe('validateEmail', () => {
  it.each(['aroha@company.co.nz', 'a.b+tag@example.com', '  spaced@example.com  '])('accepts %j', (email) => {
    expect(validateEmail(email)).toBeUndefined();
  });

  it.each([
    ['', 'Enter your email address'],
    ['   ', 'Enter your email address'],
  ])('asks for an email when given %j', (email, message) => {
    expect(validateEmail(email)).toBe(message);
  });

  it.each(['plainaddress', 'no-at-sign.com', 'two@@example.com', 'missing@dot', 'spa ce@example.com', '@example.com'])('rejects %j with a helpful example', (email) => {
    expect(validateEmail(email)).toContain('name@company.co.nz');
  });
});

describe('validateNewPassword', () => {
  it('uses the same limits as the server (8 to 72)', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(PASSWORD_MAX_LENGTH).toBe(72);
  });

  it('rejects 7 characters and accepts exactly 8', () => {
    expect(validateNewPassword('1234567')).toBe('Use at least 8 characters');
    expect(validateNewPassword('12345678')).toBeUndefined();
  });

  it('accepts exactly 72 characters and rejects 73 (bcrypt ignores everything past 72)', () => {
    expect(validateNewPassword('a'.repeat(72))).toBeUndefined();
    expect(validateNewPassword('a'.repeat(73))).toBe('Use 72 characters or fewer');
  });

  it('asks for a password when it is empty', () => {
    expect(validateNewPassword('')).toBe('Choose a password');
  });
});

describe('validatePasswordPresent (sign-in only checks that something was typed)', () => {
  it('accepts a short password, because the server decides if it is right', () => {
    expect(validatePasswordPresent('x')).toBeUndefined();
  });
  it('rejects an empty one', () => {
    expect(validatePasswordPresent('')).toBe('Enter your password');
  });
});

describe('validateName', () => {
  it('trims before checking, so spaces alone count as empty', () => {
    expect(validateName('   ')).toBe('Enter your name');
  });
  it('allows macrons and apostrophes in names', () => {
    expect(validateName('Tāne Ō\'Brien')).toBeUndefined();
  });
  it('limits the length to 80 characters', () => {
    expect(validateName('a'.repeat(80))).toBeUndefined();
    expect(validateName('a'.repeat(81))).toBe('Name must be 80 characters or fewer');
  });
});

describe('validateRequiredText and validateOptionalText', () => {
  it('mentions what is missing, in words', () => {
    expect(validateRequiredText('', 'a location', 160)).toBe('Enter a location');
  });
  it('enforces the maximum on the trimmed text', () => {
    expect(validateRequiredText(`  ${'x'.repeat(160)}  `, 'a location', 160)).toBeUndefined();
    expect(validateRequiredText('x'.repeat(161), 'a location', 160)).toContain('160');
  });
  it('lets an optional field be empty but not too long', () => {
    expect(validateOptionalText('', 80)).toBeUndefined();
    expect(validateOptionalText('x'.repeat(81), 80)).toContain('80');
  });
});

describe('dates', () => {
  it('requires an expiry date', () => {
    expect(validateRequiredDate('', 'an expiry date')).toBe('Choose an expiry date');
  });

  it('accepts a real date', () => {
    expect(validateRequiredDate('2026-12-01', 'an expiry date')).toBeUndefined();
    expect(validateRequiredDate('2028-02-29', 'an expiry date')).toBeUndefined(); // 2028 is a leap year
  });

  it('rejects dates that do not exist, even though they look right', () => {
    expect(validateRequiredDate('2026-02-31', 'an expiry date')).toBe('Enter a valid date');
    expect(validateRequiredDate('2027-02-29', 'an expiry date')).toBe('Enter a valid date'); // not a leap year
    expect(validateRequiredDate('2026-13-01', 'an expiry date')).toBe('Enter a valid date');
  });

  it('rejects text that is not in the YYYY-MM-DD shape', () => {
    expect(validateRequiredDate('17/11/2026', 'an expiry date')).toBe('Enter a valid date');
  });

  it('lets an optional date be empty', () => {
    expect(validateOptionalDate('')).toBeUndefined();
    expect(validateOptionalDate('2026-02-31')).toBe('Enter a valid date');
  });

  it('expects expiry on or after purchase (the same day is allowed)', () => {
    expect(validateExpiryAfterPurchase('2026-06-01', '2026-05-31')).toBe('Expiry date must be on or after the purchase date');
    expect(validateExpiryAfterPurchase('2026-06-01', '2026-06-01')).toBeUndefined();
    expect(validateExpiryAfterPurchase('2026-06-01', '2027-06-01')).toBeUndefined();
  });

  it('skips the comparison when either date is missing', () => {
    expect(validateExpiryAfterPurchase('', '2026-05-31')).toBeUndefined();
    expect(validateExpiryAfterPurchase('2026-06-01', '')).toBeUndefined();
  });
});

describe('validateChoice', () => {
  it('asks the person to choose when nothing is selected', () => {
    expect(validateChoice('', 'a staff member')).toBe('Choose a staff member');
    expect(validateChoice('abc123', 'a staff member')).toBeUndefined();
  });
});
