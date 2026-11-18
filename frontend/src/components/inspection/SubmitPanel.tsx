import { motion } from 'motion/react'
import { CloudOff, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOffline } from '@/context/OfflineContext'
import { formatDate } from '@/utils/dateHelpers'
import { equipmentTypeLabels } from '@/utils/statusCalculator'
import type { Inspection } from '@/types'

interface SubmitPanelProps {
  inspection: Inspection
  answered: number
  total: number
  blocker: string | null
  lastSavedAt: Date | null
  isSubmitting: boolean
  onSubmit: () => void
}

/**
 * Details, progress and the Submit button. On a desktop it is a card beside the checklist;
 * on a phone it is a bar fixed to the bottom so Submit is always in reach.
 */
export function SubmitPanel({ inspection, answered, total, blocker, lastSavedAt, isSubmitting, onSubmit }: SubmitPanelProps) {
  const { isOnline } = useOffline()
  const percent = total === 0 ? 0 : Math.round((answered / total) * 100)

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:rounded-2xl lg:border lg:p-5 lg:shadow-sm">
      {/* Details are only shown beside the checklist, where there is room */}
      <dl className="mb-5 hidden space-y-3 text-sm lg:block">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Equipment</dt>
          <dd className="mt-0.5 font-semibold">{inspection.equipmentId.name}</dd>
          <dd className="text-muted-foreground">{equipmentTypeLabels[inspection.equipmentId.type]}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Location</dt>
          <dd className="mt-0.5">{inspection.equipmentId.location}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Due</dt>
          <dd className="mt-0.5">{formatDate(inspection.scheduledDate)}</dd>
        </div>
      </dl>

      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium">
          {answered} of {total} answered
        </span>
        <span className="tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Checklist progress">
        <motion.div initial={false} animate={{ scaleX: percent / 100 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full origin-left rounded-full bg-primary" />
      </div>

      <Button size="lg" className="w-full" disabled={blocker !== null} loading={isSubmitting} onClick={onSubmit}>
        Submit inspection
      </Button>

      <p className="mt-2 min-h-5 text-center text-[13px] text-muted-foreground" aria-live="polite">
        {blocker ?? (isOnline ? 'Ready to send.' : 'Ready. It will upload when you are back online.')}
      </p>
      <p className="hidden items-center justify-center gap-1.5 text-xs text-muted-foreground lg:flex">
        {isOnline ? <Cloud className="size-3.5" aria-hidden="true" /> : <CloudOff className="size-3.5" aria-hidden="true" />}
        {lastSavedAt ? `Draft saved on this device at ${lastSavedAt.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })}` : 'Answers save on this device as you go'}
      </p>
    </div>
  )
}
