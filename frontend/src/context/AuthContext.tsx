import React, { createContext, useContext, useState, useCallback } from 'react'
import type { User } from '../types'
import { api } from '../services/api'

// --- Context shape ---

interface AuthContextValue {
  user: User | null
  /** Signs in with email + password, stores the returned JWT */
  login: (email: string, password: string) => Promise<void>
  /** Used after Google OAuth redirect — the token comes in the URL query string */
  loginWithToken: (token: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isManager: boolean
  isStaff: boolean
}

// Using undefined as default so we can detect when the hook is used outside the provider
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// --- Provider ---

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Restore the previously logged-in user from localStorage on first render
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('siteready_user')
    if (!stored) return null
    try {
      return JSON.parse(stored) as User
    } catch {
      // Corrupted data — start fresh
      return null
    }
  })

  const persistUser = useCallback((newUser: User) => {
    // Save to localStorage so the user stays logged in across browser sessions
    localStorage.setItem('siteready_user', JSON.stringify(newUser))
    // Also store the token separately — the Axios interceptor reads it from here
    localStorage.setItem('siteready_token', newUser.token)
    setUser(newUser)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    // POST credentials to backend, receive a JWT + user object
    const response = await api.post<User>('/auth/login', { email, password })
    persistUser(response.data)
  }, [persistUser])

  const loginWithToken = useCallback(async (token: string) => {
    // The token came from the Google OAuth redirect — decode user info from the
    // /auth/me endpoint rather than trusting a client-side JWT decode
    localStorage.setItem('siteready_token', token)
    const response = await api.get<User>('/auth/me')
    persistUser({ ...response.data, token })
  }, [persistUser])

  const logout = useCallback(() => {
    localStorage.removeItem('siteready_user')
    localStorage.removeItem('siteready_token')
    setUser(null)
    // Hard redirect so all in-memory state is cleared
    window.location.href = '/login'
  }, [])

  const value: AuthContextValue = {
    user,
    login,
    loginWithToken,
    logout,
    isAuthenticated: user !== null,
    isManager: user?.role === 'manager',
    isStaff: user?.role === 'staff',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// --- Hook ---

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>')
  }
  return ctx
}

export { AuthContext }
