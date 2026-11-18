import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { AssignInspectionSheet } from '@/components/inspection/AssignInspectionSheet'
import { describeDue } from '@/components/inspection/InspectionCard'
import { useInspectionBoard } from '@/hooks/useInspectionBoard'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/dateHelpers'
import type { Inspection } from '@/types'

function staffName(inspection: Inspection): string {
  return typeof inspection.assignedStaffId === 'string' ? 'Unknown' : inspection.assignedStaffId.name
}

/** "5 pass, 1 fail, 1 flag" for a finished inspection */
function summariseResults(inspection: Inspection): { pass: number; fail: number; flag: number } {
  const count = (result: string) => inspection.items.filter((item) => item.result === result).length
  return { pass: count('pass'), fail: count('fail'), flag: count('flag') }
}

function InspectionLine({ inspection }: { inspection: Inspection }) {
  const isDone = inspection.status === 'completed'
  const due = describeDue(inspection.scheduledDate)
  const results = summariseResults(inspection)

  return (
    <motion.li layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card px-4 py-3.5 shadow-sm">
      <div className="min-w-0 flex-1 basis-60">
        <p className="truncate font-semibold">{inspection.equipmentId.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {staffName(inspection)} &middot; {inspection.equipmentId.location}
        </p>
      </div>
      {isDone ? (
        <>
          <p className="flex items-center gap-2 text-xs font-semibold tabular-nums">
            <span className="rounded-full bg-ok-soft px-2.5 py-1 text-ok">{results.pass} pass</span>
            {results.fail > 0 && <span className="rounded-full bg-danger-soft px-2.5 py-1 text-danger">{results.fail} fail</span>}
            {results.flag > 0 && <span className="rounded-full bg-kowhai-soft px-2.5 py-1 text-warn">{results.flag} flag</span>}
          </p>
          <p className="w-32 text-right text-sm text-muted-foreground">{formatDate(inspection.completedAt)}</p>
        </>
      ) : (
        <>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', due.tone)}>{due.text}</span>
          <p className="w-32 text-right text-sm text-muted-foreground">{formatDate(inspection.scheduledDate)}</p>
        </>
      )}
    </motion.li>
  )
}

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
                  <InspectionLine key={inspection._id} inspection={inspection} />
                ))}
              </ul>
            </section>
          )}
          {done.length > 0 && (
            <section aria-label="Completed inspections" className="space-y-2.5">
              <h2 className="font-display text-xl font-semibold">Completed ({done.length})</h2>
              <ul className="space-y-2.5">
                {done.map((inspection) => (
                  <InspectionLine key={inspection._id} inspection={inspection} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <AssignInspectionSheet isOpen={board.isFormOpen} equipment={board.equipment} staff={board.staff} onSave={board.assign} onClose={board.closeForm} />
    </div>
  )
}
