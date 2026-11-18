import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/forms/FormError'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAssignForm } from '@/hooks/useAssignForm'
import type { AssignInspectionValues, Equipment, User } from '@/types'

interface AssignInspectionSheetProps {
  isOpen: boolean
  equipment: Equipment[]
  staff: User[]
  onSave: (values: AssignInspectionValues) => Promise<void>
  onClose: () => void
}

/** A dropdown with a visible label and an error line, matching the text fields */
function ChoiceField({ label, placeholder, value, error, onChange, onBlur, children }: {
  label: string
  placeholder: string
  value: string
  error?: string
  onChange: (value: string) => void
  onBlur: () => void
  children: ReactNode
}) {
  const id = `choice-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(next) => { onChange(next); onBlur() }}>
        <SelectTrigger id={id} className="h-11" aria-invalid={error ? true : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  )
}

/** Slide-over where a manager gives a piece of equipment to a staff member for a day */
export function AssignInspectionSheet({ isOpen, equipment, staff, onSave, onClose }: AssignInspectionSheetProps) {
  const { values, errors, setValue, markTouched, formError, isSubmitting, handleSubmit } = useAssignForm(isOpen, onSave)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl">Assign an inspection</SheetTitle>
          <SheetDescription>The checklist is chosen from the type of equipment. The staff member gets it on their phone.</SheetDescription>
        </SheetHeader>

        {staff.length === 0 || equipment.length === 0 ? (
          <div className="mt-6 rounded-xl border bg-card p-5 text-sm">
            <p className="font-semibold">{staff.length === 0 ? 'Add a staff member first' : 'Add some equipment first'}</p>
            <p className="mt-1 text-muted-foreground">An inspection needs both a person and a piece of equipment.</p>
            <Button asChild className="mt-4" onClick={onClose}>
              <Link to={staff.length === 0 ? '/staff' : '/equipment'}>{staff.length === 0 ? 'Go to staff' : 'Go to equipment'}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-1 py-1">
              <FormError message={formError} />
              <ChoiceField label="Equipment" placeholder="Choose equipment" value={values.equipmentId} error={errors.equipmentId} onChange={(next) => setValue('equipmentId', next)} onBlur={() => markTouched('equipmentId')}>
                {equipment.map((item) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.name} ({item.location})
                  </SelectItem>
                ))}
              </ChoiceField>
              <ChoiceField label="Staff member" placeholder="Choose a person" value={values.assignedStaffId} error={errors.assignedStaffId} onChange={(next) => setValue('assignedStaffId', next)} onBlur={() => markTouched('assignedStaffId')}>
                {staff.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </ChoiceField>
              <FormField
                label="Due date"
                type="date"
                value={values.scheduledDate}
                onChange={(event) => setValue('scheduledDate', event.target.value)}
                onBlur={() => markTouched('scheduledDate')}
                error={errors.scheduledDate}
              />
            </div>
            <div className="mt-4 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Assign inspection
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
