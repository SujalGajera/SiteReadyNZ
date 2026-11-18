import { useEffect, useState, type FormEvent } from 'react'
import { useFormFields } from '@/hooks/useFormFields'
import { getErrorMessage } from '@/services/api'
import type { AssignInspectionValues } from '@/types'
import { validateChoice, validateRequiredDate } from '@/utils/validators'

/** Today as YYYY-MM-DD in the device's own time zone, the default due day */
function todayAsInputValue(): string {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

/** Validation and saving for the "assign an inspection" form */
export function useAssignForm(isOpen: boolean, onSave: (values: AssignInspectionValues) => Promise<void>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useFormFields<AssignInspectionValues>({ equipmentId: '', assignedStaffId: '', scheduledDate: todayAsInputValue() }, (values) => ({
    equipmentId: validateChoice(values.equipmentId, 'a piece of equipment'),
    assignedStaffId: validateChoice(values.assignedStaffId, 'a staff member'),
    scheduledDate: validateRequiredDate(values.scheduledDate, 'a due date'),
  }))

  const { reset } = form
  // Fresh form every time the slide-over opens
  useEffect(() => {
    if (isOpen) {
      reset({ equipmentId: '', assignedStaffId: '', scheduledDate: todayAsInputValue() })
      setFormError(null)
    }
  }, [isOpen, reset])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!form.validateAll()) return

    setIsSubmitting(true)
    try {
      await onSave(form.values)
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not assign this inspection.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { ...form, formError, isSubmitting, handleSubmit }
}
