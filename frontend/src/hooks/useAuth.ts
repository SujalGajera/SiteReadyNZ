// Re-exports the AuthContext hook with a null guard.
// Components import from here rather than from the context file directly,
// so the usage pattern is consistent: const { user } = useAuth()
import { useAuthContext } from '../context/AuthContext'

export function useAuth() {
  return useAuthContext()
}
