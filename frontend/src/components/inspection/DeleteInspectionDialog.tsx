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
import type { Inspection } from '@/types'

interface DeleteInspectionDialogProps {
  /** The check waiting for confirmation, or null when the dialog is closed */
  inspection: Inspection | null
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Deleting always asks first, with a red confirm button (AGENT_RULES) */
export function DeleteInspectionDialog({ inspection, isDeleting, onConfirm, onCancel }: DeleteInspectionDialogProps) {
  return (
    <AlertDialog open={inspection !== null} onOpenChange={(open) => !open && !isDeleting && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete the check for {inspection?.equipmentId.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            It disappears from your staff member&rsquo;s list. Checks that are already done are kept as a record and cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="h-11">
            Keep it
          </AlertDialogCancel>
          {/* A plain Button (not AlertDialogAction) so the dialog stays open until the request finishes */}
          <Button variant="destructive" className="h-11" loading={isDeleting} onClick={onConfirm}>
            Delete check
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
