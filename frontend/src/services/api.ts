import axios, { AxiosError } from 'axios'
import type { ApiErrorBody } from '@/types'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/** Fired when the server says the session is no longer valid. AuthContext listens for it. */
export const SESSION_EXPIRED_EVENT = 'siteready:session-expired'

// Singleton Pattern: one configured HTTP client shared by the whole app, so base URL and
// cookie handling are set in exactly one place.
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Sends the httpOnly login cookie with every request. The token never touches JavaScript.
  withCredentials: true,
})

// If any request comes back 401 the session has ended (expired, or the account was removed).
// We announce it with an event instead of redirecting from here, so this file stays free
// of React and the router. Login attempts are excluded: a 401 there just means "wrong password".
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ''
      const isCredentialCheck = url.startsWith('/auth/login') || url.startsWith('/auth/register') || url.startsWith('/auth/me')
      if (!isCredentialCheck) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      }
    }
    return Promise.reject(error)
  }
)

/** True when the request never reached the server (offline, server down, DNS failure) */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response
}

/** Pulls a human-readable message out of a failed request, with a safe fallback */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>
    if (!axiosError.response) return 'Cannot reach the server. Check your connection and try again.'
    if (axiosError.response.status === 429) return 'Too many attempts. Please wait a few minutes and try again.'
    return axiosError.response.data?.error ?? fallback
  }
  return fallback
}
