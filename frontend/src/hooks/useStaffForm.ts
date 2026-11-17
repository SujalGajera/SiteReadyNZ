import { useEffect, useState, type FormEvent } from 'react'
import { useFormFields } from '@/hooks/useFormFields'
import { getErrorMessage } from '@/services/api'
import type { NewStaffDetails } from '@/services/staffApi'
import { validateEmail, validateName, validateNewPassword } from '@/utils/validators'

const emptyValues = { name: '', email: '', password: '' }

/** Validation and saving for the "add staff member" form */
export function useStaffForm(isOpen: boolean, onSave: (details: NewStaffDetails) => Promise<void>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useFormFields(emptyValues, (values) => ({
    name: validateName(values.name),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
  }))

  const { reset } = form
  // Fresh, empty form every time the slide-over opens
  useEffect(() => {
    if (isOpen) {
      reset(emptyValues)
      setFormError(null)
    }
  }, [isOpen, reset])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!form.validateAll()) return

    setIsSubmitting(true)
    try {
      await onSave({ name: form.values.name.trim(), email: form.values.email.trim(), password: form.values.password })
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not add this person. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { ...form, formError, isSubmitting, handleSubmit }
}
