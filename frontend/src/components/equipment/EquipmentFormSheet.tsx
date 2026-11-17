import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Equipment, EquipmentFormValues } from '@/types'
import { EquipmentForm } from './EquipmentForm'

interface EquipmentFormSheetProps {
  isOpen: boolean
  /** The item being edited, or null for "add" */
  item: Equipment | null
  onSave: (values: EquipmentFormValues) => Promise<void>
  onClose: () => void
}

/** The slide-over that holds the equipment form (AGENT_RULES: add/edit is a slide-over) */
export function EquipmentFormSheet({ isOpen, item, onSave, onClose }: EquipmentFormSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>{item ? 'Edit equipment' : 'Add equipment'}</SheetTitle>
          <SheetDescription>
            {item
              ? 'Changing the expiry date updates the status straight away.'
              : 'Status is worked out from the expiry date, so there is nothing else to set.'}
          </SheetDescription>
        </SheetHeader>
        <EquipmentForm item={item} isOpen={isOpen} onSave={onSave} onCancel={onClose} />
      </SheetContent>
    </Sheet>
  )
}
