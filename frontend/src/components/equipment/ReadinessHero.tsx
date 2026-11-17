import { motion } from 'motion/react'
import { ReadinessRing } from '@/components/brand/ReadinessRing'
import { cn } from '@/utils/cn'
import { statusDisplay } from '@/utils/statusCalculator'
import { statusStyles } from '@/utils/statusStyles'
import { readinessPercent, type EquipmentCounts, type StatusFilter } from '@/hooks/useEquipmentFilters'
import type { EquipmentStatus } from '@/types'

// Order of the segments in the bar and the legend: best to worst
const STATUS_ORDER: EquipmentStatus[] = ['ok', 'due_soon', 'overdue', 'expired']

/** One plain sentence under the heading, so the number always comes with a next step */
function describeReadiness(counts: EquipmentCounts): string {
  if (counts.total === 0) return 'Add your first item and SiteReady will start tracking it.'
  const needAction = counts.overdue + counts.expired
  if (needAction > 0) return `${needAction} ${needAction === 1 ? 'item needs' : 'items need'} action now.`
  if (counts.due_soon > 0) return `${counts.due_soon} ${counts.due_soon === 1 ? 'item expires' : 'items expire'} within 30 days.`
  return 'Everything is in date and checked.'
}

interface ReadinessHeroProps {
  counts: EquipmentCounts
  activeFilter: StatusFilter
  onSelect: (filter: StatusFilter) => void
}

/**
 * The first thing a manager sees: how ready the site is, as a ring and a bar split by status.
 * The legend underneath doubles as the status filter for the list below it.
 */
export function ReadinessHero({ counts, activeFilter, onSelect }: ReadinessHeroProps) {
  const percent = readinessPercent(counts)
  // Segment positions along a 0 to 100 bar. A 0.5 gap keeps neighbouring colours apart.
  let cursor = 0
  const segments = STATUS_ORDER.map((status) => {
    const width = counts.total === 0 ? 0 : (counts[status] / counts.total) * 100
    const segment = { status, x: cursor, width: Math.max(0, width - (width > 0 ? 0.6 : 0)) }
    cursor += width
    return segment
  })

  return (
    <section aria-label="Site readiness" className="grid gap-6 rounded-2xl border bg-card p-5 shadow-sm md:grid-cols-[auto_1fr] md:items-center md:gap-8 md:p-7">
      <div className="flex items-center gap-5">
        <ReadinessRing value={percent} size={128} strokeWidth={11} arcClassName={percent === 100 ? 'text-ok' : 'text-primary'} />
        <div className="md:hidden">
          <h2 className="font-display text-xl font-semibold">Site readiness</h2>
          <p className="mt-1 text-sm text-muted-foreground">{describeReadiness(counts)}</p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="hidden md:block">
          <h2 className="font-display text-2xl font-semibold">Site readiness</h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {counts.ok} of {counts.total} {counts.total === 1 ? 'item is' : 'items are'} ready. {describeReadiness(counts)}
          </p>
        </div>

        {/* The bar is an SVG so each segment can be positioned by data without inline styles */}
        <div className="mt-4 overflow-hidden rounded-full bg-secondary">
          <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="block h-3 w-full" role="img" aria-label={`${percent}% of items are ready`}>
            {segments.map(({ status, x, width }) => (
              <motion.rect
                key={status}
                y={0}
                height={1}
                initial={{ x: 0, width: 0 }}
                animate={{ x, width }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={statusStyles[status].fill}
              />
            ))}
          </svg>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const isActive = activeFilter === status
            return (
              <button
                key={status}
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect(isActive ? 'all' : status)}
                title={statusDisplay[status].meaning}
                className={cn(
                  'flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-accent',
                  isActive && 'bg-accent ring-1 ring-inset ring-primary/25'
                )}
              >
                <span className={cn('size-2.5 shrink-0 rounded-full', statusStyles[status].dot)} aria-hidden="true" />
                <span className="min-w-0 leading-tight">
                  <span className="block font-display text-xl font-semibold tabular-nums">{counts[status]}</span>
                  <span className="block truncate text-xs text-muted-foreground">{statusDisplay[status].label}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
