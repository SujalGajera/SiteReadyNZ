import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/forms/FormError'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useStaffForm } from '@/hooks/useStaffForm'
import type { NewStaffDetails } from '@/services/staffApi'

interface StaffFormSheetProps {
  isOpen: boolean
  onSave: (details: NewStaffDetails) => Promise<void>
  onClose: () => void
}

/** Slide-over where a manager creates a staff account */
export function StaffFormSheet({ isOpen, onSave, onClose }: StaffFormSheetProps) {
  const { values, errors, setValue, markTouched, formError, isSubmitting, handleSubmit } = useStaffForm(isOpen, onSave)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl">Add a staff member</SheetTitle>
          <SheetDescription>
            They will sign in with this email and the password you set. Tell them in person; SiteReady does not send emails yet.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-1 py-1">
            <FormError message={formError} />
            <FormField
              label="Full name"
              autoComplete="off"
              value={values.name}
              onChange={(event) => setValue('name', event.target.value)}
              onBlur={() => markTouched('name')}
              error={errors.name}
            />
            <FormField
              label="Email"
              type="email"
              autoComplete="off"
              inputMode="email"
              value={values.email}
              onChange={(event) => setValue('email', event.target.value)}
              onBlur={() => markTouched('email')}
              error={errors.email}
            />
            <FormField
              label="First password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => setValue('password', event.target.value)}
              onBlur={() => markTouched('password')}
              error={errors.password}
              hint="At least 8 characters."
            />
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Add staff member
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
