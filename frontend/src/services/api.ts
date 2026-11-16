import axios from 'axios'

// Singleton Axios instance — Singleton Pattern: one configured HTTP client
// shared across the whole app. Auth headers are injected once here via an
// interceptor, so individual API calls don't need to worry about tokens.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach the JWT Bearer token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('siteready_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: if the server returns 401 (token expired or invalid),
// clear stored credentials and send the user back to the login page
api.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('siteready_token')
      localStorage.removeItem('siteready_user')
      // Hard redirect — clears all in-memory state cleanly
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
