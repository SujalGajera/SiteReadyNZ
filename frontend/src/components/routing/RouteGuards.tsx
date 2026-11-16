import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { BrandMark } from '@/components/layout/BrandMark'
import type { UserRole } from '@/types'

/** Shown for a moment while the app asks the server whether a session exists */
function SessionCheckScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
      <div className="animate-pulse">
        <BrandMark />
      </div>
    </div>
  )
}

interface ProtectedRouteProps {
  /** If given, only these roles may see the routes inside. Others are sent to the home page. */
  roles?: UserRole[]
}

/**
 * Wraps routes that need a signed-in user.
 * - not signed in  -> /login (remembering where they were heading)
 * - wrong role     -> home page (e.g. staff opening a manager-only page)
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <SessionCheckScreen />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

/** Wraps login and register: someone who is already signed in has no reason to see them */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <SessionCheckScreen />
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}
