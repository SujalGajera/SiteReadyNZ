import React, { useState } from 'react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import type { Equipment } from '../../types'

// Only the fields the user fills in — _id, status, lastInspectedAt come from the server
type EquipmentFormData = Omit<Equipment, '_id' | 'status' | 'lastInspectedAt'>

interface EquipmentFormProps {
  initialData?: Partial<EquipmentFormData>
  onSubmit: (data: EquipmentFormData) => Promise<void>
  onCancel: () => void
}

const equipmentTypeOptions = [
  { value: 'fire_extinguisher', label: 'Fire Extinguisher' },
  { value: 'first_aid', label: 'First Aid Kit' },
  { value: 'aed', label: 'AED (Defibrillator)' },
  { value: 'safety_sign', label: 'Safety Sign' },
  { value: 'other', label: 'Other' },
]

/** Form for creating or editing a piece of equipment. Validates all fields on submit. */
export function EquipmentForm({ initialData, onSubmit, onCancel }: EquipmentFormProps) {
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: initialData?.name ?? '',
    type: initialData?.type ?? 'fire_extinguisher',
    location: initialData?.location ?? '',
    serialNumber: initialData?.serialNumber ?? '',
    purchaseDate: initialData?.purchaseDate ?? '',
    expiryDate: initialData?.expiryDate ?? '',
    assignedManagerId: initialData?.assignedManagerId ?? '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof EquipmentFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  const updateField = (field: keyof EquipmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear the error for this field as the user corrects it
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EquipmentFormData, string>> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial number is required'
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Purchase date is required'
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required'
    if (
      formData.purchaseDate &&
      formData.expiryDate &&
      formData.expiryDate <= formData.purchaseDate
    ) {
      newErrors.expiryDate = 'Expiry date must be after purchase date'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Equipment Name"
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
        error={errors.name}
        placeholder="e.g. Fire Extinguisher Block A"
      />

      <Select
        label="Type"
        options={equipmentTypeOptions}
        value={formData.type}
        onChange={(e) => updateField('type', e.target.value)}
        error={errors.type}
      />

      <Input
        label="Location"
        value={formData.location}
        onChange={(e) => updateField('location', e.target.value)}
        error={errors.location}
        placeholder="e.g. Level 2 — Kitchen"
      />

      <Input
        label="Serial Number"
        value={formData.serialNumber}
        onChange={(e) => updateField('serialNumber', e.target.value)}
        error={errors.serialNumber}
        placeholder="e.g. FE-2024-001"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Purchase Date"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => updateField('purchaseDate', e.target.value)}
          error={errors.purchaseDate}
        />
        <Input
          label="Expiry Date"
          type="date"
          value={formData.expiryDate}
          onChange={(e) => updateField('expiryDate', e.target.value)}
          error={errors.expiryDate}
        />
      </div>

      <Input
        label="Assigned Manager ID (optional)"
        value={formData.assignedManagerId ?? ''}
        onChange={(e) => updateField('assignedManagerId', e.target.value)}
        placeholder="Manager user ID"
      />

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? 'Save Changes' : 'Add Equipment'}
        </Button>
      </div>
    </form>
  )
}
