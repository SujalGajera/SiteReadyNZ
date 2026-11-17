import { cn } from '@/utils/cn'
import type { EquipmentCounts, StatusFilter } from '@/hooks/useEquipmentFilters'

interface StatsCardsProps {
  counts: EquipmentCounts
  activeFilter: StatusFilter
  onSelect: (filter: StatusFilter) => void
}

/**
 * One bordered strip split into four cells (instead of four floating cards).
 * Each cell is also a filter button: tapping "Due soon" filters the table below it.
 */
export function StatsCards({ counts, activeFilter, onSelect }: StatsCardsProps) {
  const cells: { label: string; value: number; filter: StatusFilter; dot: string }[] = [
    { label: 'Total items', value: counts.total, filter: 'all', dot: 'bg-foreground/60' },
    { label: 'In date', value: counts.ok, filter: 'ok', dot: 'bg-ok' },
    { label: 'Due soon', value: counts.dueSoon, filter: 'due_soon', dot: 'bg-warn' },
    { label: 'Needs action', value: counts.needsAction, filter: 'attention', dot: 'bg-danger' },
  ]

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card shadow-sm lg:grid-cols-4">
      {cells.map((cell, index) => {
        const isActive = activeFilter === cell.filter
        return (
          <button
            key={cell.label}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? 'all' : cell.filter)}
            className={cn(
              'relative min-h-[88px] px-5 py-4 text-left transition-colors duration-150 hover:bg-accent/60',
              // hairlines between cells: right edge on the left column, bottom edge on the top row
              index % 2 === 0 && 'border-r',
              index < 2 && 'border-b lg:border-b-0',
              index > 0 && 'lg:border-r-0 lg:border-l',
              isActive && 'bg-accent'
            )}
          >
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span className={cn('size-2 rounded-full', cell.dot)} aria-hidden="true" />
              {cell.label}
            </span>
            <span className="mt-1 block text-[32px] font-semibold leading-none tabular-nums tracking-tight">
              {cell.value}
            </span>
            {/* Underline slides in with a transform when the cell is the active filter */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary transition-transform duration-200 ease-snap',
                isActive ? 'scale-x-100' : 'scale-x-0'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
