import { useEffect, useState, type FormEvent } from 'react'
import { useFormFields } from '@/hooks/useFormFields'
import { getErrorMessage } from '@/services/api'
import { toDateInputValue } from '@/utils/dateHelpers'
import {
  validateExpiryAfterPurchase,
  validateOptionalDate,
  validateOptionalText,
  validateRequiredDate,
  validateRequiredText,
} from '@/utils/validators'
import type { Equipment, EquipmentFormValues, EquipmentType } from '@/types'

const emptyValues: EquipmentFormValues = {
  name: '',
  type: 'fire_extinguisher',
  location: '',
  serialNumber: '',
  purchaseDate: '',
  expiryDate: '',
}

function valuesFromEquipment(item: Equipment | null): EquipmentFormValues {
  if (!item) return emptyValues
  return {
    name: item.name,
    type: item.type,
    location: item.location,
    serialNumber: item.serialNumber ?? '',
    purchaseDate: toDateInputValue(item.purchaseDate),
    expiryDate: toDateInputValue(item.expiryDate),
  }
}

interface UseEquipmentFormOptions {
  /** The item being edited, or null when adding a new one */
  item: Equipment | null
  /** Whether the slide-over is open. The form resets every time it opens. */
  isOpen: boolean
  /** Sends the values to the server. Rejects with the server's error if it fails. */
  onSave: (values: EquipmentFormValues) => Promise<void>
}

/** All the logic behind the add / edit equipment form */
export function useEquipmentForm({ item, isOpen, onSave }: UseEquipmentFormOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useFormFields<EquipmentFormValues>(valuesFromEquipment(item), (values) => ({
    name: validateRequiredText(values.name, 'a name', 120),
    type: undefined, // always one of the dropdown options
    location: validateRequiredText(values.location, 'a location', 160),
    serialNumber: validateOptionalText(values.serialNumber, 80),
    purchaseDate: validateOptionalDate(values.purchaseDate),
    expiryDate:
      validateRequiredDate(values.expiryDate, 'an expiry date') ??
      validateExpiryAfterPurchase(values.purchaseDate, values.expiryDate),
  }))

  const { reset } = form
  // Start from a clean form (or the item's current values) each time the slide-over opens
  useEffect(() => {
    if (isOpen) {
      reset(valuesFromEquipment(item))
      setFormError(null)
    }
  }, [isOpen, item, reset])

  function setType(type: EquipmentType) {
    form.setValue('type', type)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!form.validateAll()) return

    setIsSubmitting(true)
    try {
      await onSave({ ...form.values, name: form.values.name.trim(), location: form.values.location.trim() })
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save the equipment. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { ...form, setType, formError, isSubmitting, handleSubmit }
}
