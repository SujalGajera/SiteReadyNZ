import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, isNetworkError, SESSION_EXPIRED_EVENT } from '@/services/api'
import { clearCachedInspections } from '@/services/offlineDb'
import { detachDeviceFromCurrentUser } from '@/services/pushClient'
import type { User } from '@/types'

// Context/Provider Pattern: any component can read the signed-in user without props being
// passed down through every level.

// Only the public profile is cached (never the token), so the app can open offline.
const CACHED_USER_KEY = 'siteready_user'

export interface RegisterDetails {
  name: string
  email: string
  password: string
}

export interface AuthContextValue {
  user: User | null
  /** True until the first "who am I?" check has finished, so guards do not flash the login page */
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (details: RegisterDetails) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readCachedUser(): User | null {
  try {
    const stored = localStorage.getItem(CACHED_USER_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  } catch {
    return null // Corrupt data: treat as signed out
  }
}

function writeCachedUser(user: User | null): void {
  if (user) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(CACHED_USER_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Keeps React state and the offline cache in step
  const updateUser = useCallback((nextUser: User | null) => {
    setUser(nextUser)
    writeCachedUser(nextUser)
  }, [])

  // On first load, ask the server who we are. The cookie is invisible to JavaScript,
  // so this call is the only way to find out whether a session exists.
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const response = await api.get<{ user: User }>('/auth/me')
        if (!cancelled) updateUser(response.data.user)
      } catch (error) {
        if (cancelled) return
        if (isNetworkError(error)) {
          // Offline or server unreachable: keep the person working with their cached profile.
          // Their cookie is still valid, and the server re-checks it on every request.
          setUser(readCachedUser())
        } else {
          updateUser(null) // The server said no: the session is over
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void restoreSession()
    return () => {
      cancelled = true
    }
  }, [updateUser])

  // Sign out locally whenever any API call reports an expired session
  useEffect(() => {
    const handleExpired = () => updateUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
  }, [updateUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<{ user: User }>('/auth/login', { email, password })
      updateUser(response.data.user)
      return response.data.user
    },
    [updateUser]
  )

  const register = useCallback(
    async (details: RegisterDetails) => {
      const response = await api.post<{ user: User }>('/auth/register', details)
      updateUser(response.data.user)
      return response.data.user
    },
    [updateUser]
  )

  const logout = useCallback(async () => {
    // Stop this person's alerts reaching the phone. It must happen before the cookie is removed.
    await detachDeviceFromCurrentUser().catch(() => undefined)
    try {
      // The server removes the cookie. If we are offline this fails, but we still sign out locally.
      await api.post('/auth/logout')
    } catch {
      // Intentionally ignored: local sign-out below is what matters to this device
    }
    updateUser(null)
    // Remove cached API answers and the saved task list so the next person on a shared device cannot see them offline.
    // Unsent checklists are NOT removed: that is someone's finished work, and it uploads when they sign in again.
    if ('caches' in window) await caches.delete('api-cache')
    await clearCachedInspections()
  }, [updateUser])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
