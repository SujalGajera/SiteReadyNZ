import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { Equipment } from '@/types'

interface DeleteEquipmentDialogProps {
  /** The item waiting for confirmation, or null when the dialog is closed */
  item: Equipment | null
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Deleting always asks first, with a red confirm button (AGENT_RULES) */
export function DeleteEquipmentDialog({ item, isDeleting, onConfirm, onCancel }: DeleteEquipmentDialogProps) {
  return (
    <AlertDialog open={item !== null} onOpenChange={(open) => !open && !isDeleting && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {item?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes it from your equipment list for good. Past inspections that mention it are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="h-11">
            Keep it
          </AlertDialogCancel>
          {/* A plain Button (not AlertDialogAction) so the dialog stays open until the request finishes */}
          <Button variant="destructive" className="h-11" loading={isDeleting} onClick={onConfirm}>
            Delete equipment
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
