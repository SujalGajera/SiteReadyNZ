import { cn } from '@/utils/cn'
import { statusDisplay } from '@/utils/statusCalculator'
import type { EquipmentStatus } from '@/types'

const statusClasses: Record<EquipmentStatus, string> = {
  ok: 'bg-ok-soft text-ok',
  due_soon: 'bg-warn-soft text-warn',
  overdue: 'bg-danger-soft text-danger',
  // Expired is the most serious state, so it is the only solid-filled badge
  expired: 'bg-danger text-destructive-foreground',
}

/** Uppercase, tight-tracked pill (AGENT_RULES). The text label means colour is never the only signal. */
export function StatusBadge({ status, className }: { status: EquipmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        statusClasses[status],
        className
      )}
    >
      {statusDisplay[status].label}
    </span>
  )
}
