/**
 * Strategy Pattern: the status calculation algorithm lives here, isolated from
 * any component or model. If the business rule changes (e.g. "due_soon" window
 * expands to 60 days), we update this one function and everything that calls it
 * gets the new behaviour automatically.
 */
export function calculateEquipmentStatus(
  expiryDate: Date
): 'ok' | 'due_soon' | 'overdue' | 'expired' {
  const now = new Date()
  // Strip the time component so we compare calendar days, not exact timestamps
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const expiry = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate()
  )

  const msPerDay = 1000 * 60 * 60 * 24
  const daysRemaining = Math.floor(
    (expiry.getTime() - today.getTime()) / msPerDay
  )

  if (daysRemaining < 0) return 'expired'    // Past expiry date
  if (daysRemaining === 0) return 'overdue'  // Expires today — needs immediate attention
  if (daysRemaining <= 30) return 'due_soon' // Within 30-day warning window
  return 'ok'
}
