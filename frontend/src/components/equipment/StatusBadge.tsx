import { cn } from '@/utils/cn'
import { statusDisplay } from '@/utils/statusCalculator'
import { statusStyles } from '@/utils/statusStyles'
import type { EquipmentStatus } from '@/types'

/** Uppercase, tight-tracked pill (AGENT_RULES). The text label means colour is never the only signal. */
export function StatusBadge({ status, className }: { status: EquipmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase leading-none tracking-[0.08em]',
        statusStyles[status].badge,
        className
      )}
    >
      {statusDisplay[status].label}
    </span>
  )
}
