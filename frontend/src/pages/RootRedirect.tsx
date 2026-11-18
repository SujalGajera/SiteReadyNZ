import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/** "/" has no page of its own: managers start at their equipment, staff at their inspections */
export default function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'manager' ? '/equipment' : '/inspections'} replace />
}
