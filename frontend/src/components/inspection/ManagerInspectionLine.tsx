import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { describeDue } from '@/components/inspection/InspectionCard'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/dateHelpers'
import type { Inspection } from '@/types'

function staffName(inspection: Inspection): string {
  return typeof inspection.assignedStaffId === 'string' ? 'Unknown' : inspection.assignedStaffId.name
}

/** How many answers of each kind a finished inspection has */
function summariseResults(inspection: Inspection): { pass: number; fail: number; flag: number } {
  const count = (result: string) => inspection.items.filter((item) => item.result === result).length
  return { pass: count('pass'), fail: count('fail'), flag: count('flag') }
}

interface ManagerInspectionLineProps {
  inspection: Inspection
  /** Asks to delete this check. Only open checks can be deleted, so finished ones show no button. */
  onDelete: (inspection: Inspection) => void
}

/** One row of the manager's list: who has what, and for a finished check how it went */
export function ManagerInspectionLine({ inspection, onDelete }: ManagerInspectionLineProps) {
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
          <Button variant="ghost" className="text-danger hover:text-danger" aria-label={`Delete the check for ${inspection.equipmentId.name}`} onClick={() => onDelete(inspection)}>
            Delete
          </Button>
        </>
      )}
    </motion.li>
  )
}
