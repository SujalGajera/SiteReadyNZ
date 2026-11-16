// pages/auth/Login.tsx — Email/password login page with Google OAuth link
// Simple, clean form — no decorative elements, plain labels, full validation.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  // Basic client-side validation before hitting the server
  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email address'
    if (!password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await login(email, password)
      // Successful login — the AuthContext has stored the user, now redirect
      navigate('/dashboard')
    } catch {
      // Show a friendly message — don't expose internal error details
      setErrors({ general: 'Incorrect email or password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth — redirect to the backend OAuth entry point
  function handleGoogleLogin() {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`
  }

  return (
    // Full-height centred layout — works on all screen sizes
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo + title */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-700 rounded flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="text-lg font-semibold text-zinc-800">SiteReady NZ</span>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-800 mb-1">Sign in</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Enter your work email and password to continue.
        </p>

        {/* General error — shown when login credentials are wrong */}
        {errors.general && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            error={errors.password}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
            Sign in
          </Button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-xs text-zinc-400">or</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {/* Google login — backend handles the OAuth redirect */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleGoogleLogin}
          className="w-full"
        >
          Continue with Google
        </Button>

        {/* Register link */}
        <p className="text-sm text-center text-zinc-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-700 hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
