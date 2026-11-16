/** "Sujal Gajera" -> "SG". Falls back to "?" so the avatar is never empty. */
export function getInitials(fullName: string | undefined | null): string {
  if (!fullName) return '?'
  const initials = fullName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
  return initials.toUpperCase() || '?'
}
