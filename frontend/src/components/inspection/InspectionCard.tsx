import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { daysUntil, formatDate } from '@/utils/dateHelpers'
import { equipmentTypeCodes } from '@/utils/statusCalculator'
import type { Inspection } from '@/types'

/** "Due today", "Due in 3 days", "2 days overdue" and the colour that goes with it */
export function describeDue(scheduledDate: string): { text: string; tone: string } {
  const days = daysUntil(scheduledDate)
  if (days < 0) return { text: `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue`, tone: 'bg-overdue-soft text-overdue' }
  if (days === 0) return { text: 'Due today', tone: 'bg-kowhai-soft text-warn' }
  if (days === 1) return { text: 'Due tomorrow', tone: 'bg-secondary text-secondary-foreground' }
  return { text: `Due in ${days} days`, tone: 'bg-secondary text-secondary-foreground' }
}

interface InspectionCardProps {
  inspection: Inspection
  /** Questions already answered in a draft saved on this device */
  draftAnswered?: number
}

/** One job on the staff member's list. The whole card is the tap target. */
export function InspectionCard({ inspection, draftAnswered = 0 }: InspectionCardProps) {
  const due = describeDue(inspection.scheduledDate)
  const total = inspection.items.length

  return (
    <motion.li layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
      <Link
        to={`/inspections/${inspection._id}`}
        className="group flex min-h-[84px] items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary font-display text-sm font-semibold" aria-hidden="true">
          {equipmentTypeCodes[inspection.equipmentId.type]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{inspection.equipmentId.name}</span>
          <span className="block truncate text-sm text-muted-foreground">{inspection.equipmentId.location}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', due.tone)}>{due.text}</span>
            <span className="text-xs text-muted-foreground">{formatDate(inspection.scheduledDate)}</span>
            {draftAnswered > 0 && (
              <span className="text-xs font-medium text-fern">
                {draftAnswered} of {total} answered
              </span>
            )}
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-snap group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </motion.li>
  )
}
