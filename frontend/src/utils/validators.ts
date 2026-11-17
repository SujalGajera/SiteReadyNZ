// Pure validation functions. Each returns an error message, or undefined when the value is fine.
// They are kept free of React so they are trivial to unit test (Phase 6).
// The server repeats these checks; the browser versions exist only to give instant feedback.

// Deliberately simple: one "@", something on each side, a dot in the domain. The server is stricter.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72 // bcrypt ignores everything after 72 bytes

export function validateName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) return 'Enter your name'
  if (trimmed.length > 80) return 'Name must be 80 characters or fewer'
  return undefined
}

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim()
  if (!trimmed) return 'Enter your email address'
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address, like name@company.co.nz'
  return undefined
}

/** For sign-in we only check that something was typed. The server decides if it is correct. */
export function validatePasswordPresent(password: string): string | undefined {
  return password ? undefined : 'Enter your password'
}

/** For creating an account we enforce the length rules */
export function validateNewPassword(password: string): string | undefined {
  if (!password) return 'Choose a password'
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters`
  if (password.length > PASSWORD_MAX_LENGTH) return `Use ${PASSWORD_MAX_LENGTH} characters or fewer`
  return undefined
}

/** A required text field with a maximum length, e.g. equipment name or location */
export function validateRequiredText(value: string, fieldName: string, maxLength: number): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return `Enter ${fieldName}`
  if (trimmed.length > maxLength) return `Keep it to ${maxLength} characters or fewer`
  return undefined
}

/** An optional text field with a maximum length */
export function validateOptionalText(value: string, maxLength: number): string | undefined {
  return value.trim().length > maxLength ? `Keep it to ${maxLength} characters or fewer` : undefined
}

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-31) */
function isRealDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function validateRequiredDate(value: string, fieldName: string): string | undefined {
  if (!value) return `Choose ${fieldName}`
  return isRealDate(value) ? undefined : 'Enter a valid date'
}

export function validateOptionalDate(value: string): string | undefined {
  if (!value) return undefined
  return isRealDate(value) ? undefined : 'Enter a valid date'
}

/** The expiry date cannot come before the purchase date. Dates are YYYY-MM-DD so text comparison works. */
export function validateExpiryAfterPurchase(purchaseDate: string, expiryDate: string): string | undefined {
  if (purchaseDate && expiryDate && expiryDate < purchaseDate) {
    return 'Expiry date must be on or after the purchase date'
  }
  return undefined
}
