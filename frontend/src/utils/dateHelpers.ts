// Date helpers.
//
// Equipment dates are calendar days ("expires 1 December"), not moments in time. The server
// stores them as midnight UTC, so we always read and format them in UTC. That way the day a
// manager picked never shifts by one, whichever time zone the phone is in.

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** "2026-12-01T00:00:00.000Z" -> "2026-12-01", the format an <input type="date"> uses */
export function toDateInputValue(isoDate: string | undefined | null): string {
  return isoDate ? isoDate.slice(0, 10) : ''
}

/** "1 Dec 2026" in New Zealand style. Returns an en dash for missing dates. */
export function formatDate(isoDate: string | undefined | null): string {
  if (!isoDate) return '\u2013'
  return new Date(isoDate).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Whole calendar days from today (device date) until the given day. Negative means it has passed. */
export function daysUntil(isoDate: string, now: Date = new Date()): number {
  const target = new Date(isoDate)
  const targetDay = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate())
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((targetDay - today) / MS_PER_DAY)
}

/** Friendly countdown: "in 12 days", "today", "3 days ago" */
export function describeDaysUntil(isoDate: string, now: Date = new Date()): string {
  const days = daysUntil(isoDate, now)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`
}
