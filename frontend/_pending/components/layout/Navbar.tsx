import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Top navigation bar.
 * - Left: breadcrumb derived from the current URL path
 * - Right: Alerts button, user initials avatar, name/role, Logout
 */
export function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Build a readable breadcrumb from the URL segments
  // e.g. /inspections/I-07 → "Inspections / I-07"
  const breadcrumb = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      // Capitalise the first letter of each segment
      segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join(' / ')

  // Extract the user's initials from their full name for the avatar circle
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <header className="fixed top-0 left-40 right-0 z-20 h-14 bg-white border-b border-zinc-200 flex items-center px-6 gap-4">

      {/* Breadcrumb */}
      <span className="text-sm text-zinc-500 flex-1">
        {breadcrumb || 'Dashboard'}
      </span>

      {/* Right-side controls */}
      <div className="flex items-center gap-3">

        {/* Alerts button — plain text to match "no icon-only" rule */}
        <button className="text-sm text-zinc-600 hover:text-zinc-800 transition-colors min-h-[36px] px-2">
          Alerts
        </button>

        {/* User avatar — initials in a coloured circle */}
        <div
          className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center shrink-0"
          aria-label={`User: ${user?.name}`}
        >
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>

        {/* Name and role */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-medium text-zinc-800 leading-none">
            {user?.name ?? 'User'}
          </span>
          <span className="text-xs text-zinc-500 capitalize">
            {user?.role ?? ''}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="text-sm text-zinc-600 hover:text-red-500 transition-colors min-h-[36px] px-2"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
