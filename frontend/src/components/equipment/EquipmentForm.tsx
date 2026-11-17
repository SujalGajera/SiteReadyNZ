import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/forms/FormError'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEquipmentForm } from '@/hooks/useEquipmentForm'
import { equipmentTypeLabels } from '@/utils/statusCalculator'
import type { Equipment, EquipmentFormValues, EquipmentType } from '@/types'

interface EquipmentFormProps {
  item: Equipment | null
  isOpen: boolean
  onSave: (values: EquipmentFormValues) => Promise<void>
  onCancel: () => void
}

/** The add / edit form shown inside the slide-over */
export function EquipmentForm({ item, isOpen, onSave, onCancel }: EquipmentFormProps) {
  const { values, errors, setValue, setType, markTouched, formError, isSubmitting, handleSubmit } = useEquipmentForm({
    item,
    isOpen,
    onSave,
  })

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-1 py-1">
        <FormError message={formError} />

        <FormField
          label="Name"
          value={values.name}
          onChange={(event) => setValue('name', event.target.value)}
          onBlur={() => markTouched('name')}
          error={errors.name}
          hint="For example: Fire extinguisher, reception"
        />

        <div className="space-y-1.5">
          <Label htmlFor="equipment-type">Type</Label>
          <Select value={values.type} onValueChange={(value) => setType(value as EquipmentType)}>
            <SelectTrigger id="equipment-type" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(equipmentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField
          label="Location"
          value={values.location}
          onChange={(event) => setValue('location', event.target.value)}
          onBlur={() => markTouched('location')}
          error={errors.location}
          hint="Where someone would go to find it"
        />

        <FormField
          label="Serial number (optional)"
          value={values.serialNumber}
          onChange={(event) => setValue('serialNumber', event.target.value)}
          onBlur={() => markTouched('serialNumber')}
          error={errors.serialNumber}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Purchase date (optional)"
            type="date"
            value={values.purchaseDate}
            onChange={(event) => setValue('purchaseDate', event.target.value)}
            onBlur={() => markTouched('purchaseDate')}
            error={errors.purchaseDate}
          />
          <FormField
            label="Expiry date"
            type="date"
            value={values.expiryDate}
            onChange={(event) => setValue('expiryDate', event.target.value)}
            onBlur={() => markTouched('expiryDate')}
            error={errors.expiryDate}
          />
        </div>
      </div>

      {/* Buttons stay pinned to the bottom while the fields scroll */}
      <div className="mt-4 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {item ? 'Save changes' : 'Add equipment'}
        </Button>
      </div>
    </form>
  )
}
