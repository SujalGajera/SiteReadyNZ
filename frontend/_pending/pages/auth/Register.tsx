// pages/auth/Register.tsx — New user registration form
// Collects name, email, password, and role. Validates everything before submitting.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'

const roleOptions = [
  { value: 'manager', label: 'Manager — manage equipment and staff' },
  { value: 'staff', label: 'Staff — complete inspection checklists' },
]

export default function RegisterPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'manager' | 'staff'>('staff')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Full name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email address'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // POST to the register endpoint — backend returns 201 on success
      await api.post('/auth/register', { name, email, password, role })
      // Registration successful — send them to login to sign in
      navigate('/login')
    } catch {
      setErrors({ general: 'Registration failed. That email may already be in use.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-700 rounded flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="text-lg font-semibold text-zinc-800">SiteReady NZ</span>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-800 mb-1">Create an account</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Set up your SiteReady NZ account to get started.
        </p>

        {/* General server error */}
        {errors.general && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
            error={errors.name}
            placeholder="e.g. James Tahu"
            autoComplete="name"
          />

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })) }}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Select
            label="Role"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value as 'manager' | 'staff')}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
            error={errors.password}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />

          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })) }}
            error={errors.confirmPassword}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
            Create account
          </Button>
        </form>

        <p className="text-sm text-center text-zinc-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-700 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
