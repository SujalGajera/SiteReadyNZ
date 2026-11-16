/**
 * Date formatting utilities.
 * Keeping date logic here (not scattered through components) means changing
 * locale or format only requires editing this one file.
 */

/** Returns a human-readable date in "31 October 2026" format */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Returns the number of whole days until the given date (negative = past) */
export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((target.getTime() - today.getTime()) / msPerDay)
}

/** Returns true when the given date is in the past */
export function isExpired(date: Date | string): boolean {
  return daysUntil(date) < 0
}
