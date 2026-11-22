import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { AssignInspectionSheet } from '@/components/inspection/AssignInspectionSheet'
import { DeleteInspectionDialog } from '@/components/inspection/DeleteInspectionDialog'
import { ManagerInspectionLine } from '@/components/inspection/ManagerInspectionLine'
import { useInspectionBoard } from '@/hooks/useInspectionBoard'

/** Manager's view: who has been given what, and what came back */
export default function ManagerInspectionsPage() {
  const board = useInspectionBoard()
  const open = board.inspections.filter((inspection) => inspection.status !== 'completed')
  const done = board.inspections.filter((inspection) => inspection.status === 'completed').reverse()

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        eyebrow="Inspections"
        title="Site checks"
        description="Give a piece of equipment to someone on your team. Their results come back here, even if they did the check without signal."
        actions={
          <Button onClick={board.openForm}>
            <Plus aria-hidden="true" />
            Assign inspection
          </Button>
        }
      />

      {board.isLoading ? (
        <div className="space-y-2.5" role="status" aria-label="Loading inspections">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-[68px] rounded-xl" />
          ))}
        </div>
      ) : board.loadError ? (
        <div className="rounded-2xl border bg-card px-6 py-12 text-center" role="alert">
          <p className="text-sm text-danger">{board.loadError}</p>
          <Button variant="outline" className="mt-4" onClick={() => void board.reload()}>
            Try again
          </Button>
        </div>
      ) : board.inspections.length === 0 ? (
        <div className="relative isolate overflow-hidden rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <ContourBackdrop className="absolute inset-0 -z-10 h-full w-full text-fern/[0.1] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          <h2 className="font-display text-2xl font-semibold">No checks assigned yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">Assign your first inspection and your staff member will see it on their phone.</p>
          <Button className="mt-6" onClick={board.openForm}>
            Assign inspection
          </Button>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <section aria-label="Open inspections" className="space-y-2.5">
              <h2 className="font-display text-xl font-semibold">Open ({open.length})</h2>
              <ul className="space-y-2.5">
                {open.map((inspection) => (
                  <ManagerInspectionLine key={inspection._id} inspection={inspection} onDelete={board.requestDelete} />
                ))}
              </ul>
            </section>
          )}
          {done.length > 0 && (
            <section aria-label="Completed inspections" className="space-y-2.5">
              <h2 className="font-display text-xl font-semibold">Completed ({done.length})</h2>
              <ul className="space-y-2.5">
                {done.map((inspection) => (
                  <ManagerInspectionLine key={inspection._id} inspection={inspection} onDelete={board.requestDelete} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <AssignInspectionSheet isOpen={board.isFormOpen} equipment={board.equipment} staff={board.staff} onSave={board.assign} onClose={board.closeForm} />
      <DeleteInspectionDialog inspection={board.inspectionToDelete} isDeleting={board.isDeleting} onConfirm={() => void board.confirmDelete()} onCancel={board.cancelDelete} />
    </div>
  )
}
