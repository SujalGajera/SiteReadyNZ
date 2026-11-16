import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useFormFields } from '@/hooks/useFormFields'
import { getErrorMessage } from '@/services/api'
import type { UserRole } from '@/types'
import {
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordPresent,
} from '@/utils/validators'

/** After signing in, go back to the page the user originally wanted, or to the home page */
function useRedirectTarget(): string {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  return from && from.startsWith('/') ? from : '/'
}

export function useLoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const redirectTo = useRedirectTarget()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useFormFields({ email: '', password: '' }, (values) => ({
    email: validateEmail(values.email),
    password: validatePasswordPresent(values.password),
  }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!form.validateAll()) return

    setIsSubmitting(true)
    try {
      await login(form.values.email.trim(), form.values.password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not sign in. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { ...form, formError, isSubmitting, handleSubmit }
}

export function useRegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<UserRole>('manager')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useFormFields({ name: '', email: '', password: '' }, (values) => ({
    name: validateName(values.name),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
  }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!form.validateAll()) return

    setIsSubmitting(true)
    try {
      await register({
        name: form.values.name.trim(),
        email: form.values.email.trim(),
        password: form.values.password,
        role,
      })
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not create the account. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { ...form, role, setRole, formError, isSubmitting, handleSubmit }
}
