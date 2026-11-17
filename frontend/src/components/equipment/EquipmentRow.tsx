import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'
import { describeDaysUntil, formatDate, lifeRemaining } from '@/utils/dateHelpers'
import { equipmentTypeCodes, equipmentTypeLabels } from '@/utils/statusCalculator'
import { statusStyles } from '@/utils/statusStyles'
import type { Equipment } from '@/types'
import { StatusBadge } from './StatusBadge'

export interface EquipmentRowActions {
  onEdit: (item: Equipment) => void
  onDelete: (item: Equipment) => void
}

interface EquipmentRowProps extends EquipmentRowActions {
  item: Equipment
}

/**
 * One piece of equipment as a ledger line: a coloured edge for its status, a type tile,
 * the name and place, a "life bar" showing how much of its life is left, and a menu.
 * `layout` lets neighbouring rows glide into place when the list is filtered or sorted.
 */
// forwardRef is required: AnimatePresence in "popLayout" mode measures each row through its ref
export const EquipmentRow = forwardRef<HTMLLIElement, EquipmentRowProps>(function EquipmentRow({ item, onEdit, onDelete }, ref) {
  const styles = statusStyles[item.status]
  const life = lifeRemaining(item)

  return (
    <motion.li
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-wrap items-center gap-x-4 gap-y-3 overflow-hidden rounded-xl border bg-card py-3.5 pl-6 pr-3 shadow-sm transition-shadow duration-200 hover:shadow-md md:flex-nowrap"
    >
      {/* Status colour runs down the left edge, like a tab on a ledger */}
      <span className={cn('absolute inset-y-0 left-0 w-1.5', styles.edge)} aria-hidden="true" />

      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary font-display text-[13px] font-semibold tracking-wide text-secondary-foreground"
        title={equipmentTypeLabels[item.type]}
        aria-hidden="true"
      >
        {equipmentTypeCodes[item.type]}
      </span>

      <div className="min-w-0 flex-1 basis-[55%] md:basis-auto">
        <Link to={`/equipment/${item._id}`} className="block truncate font-semibold hover:text-fern hover:underline hover:underline-offset-4">
          {item.name}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {item.location}
          {item.serialNumber ? ` \u00b7 ${item.serialNumber}` : ''}
        </p>
      </div>

      <div className="order-last basis-full md:order-none md:basis-52">
        <p className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium tabular-nums">{formatDate(item.expiryDate)}</span>
          <span className={cn('text-xs', styles.text)}>{describeDaysUntil(item.expiryDate)}</span>
        </p>
        {/* How much of the item's life is left. Scaled with a transform so it animates smoothly. */}
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: life }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={cn('h-full origin-left rounded-full', styles.bar)}
          />
        </div>
      </div>

      <StatusBadge status={item.status} className="md:w-[118px] md:justify-center" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${item.name}`}>
            <MoreHorizontal className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="min-h-11 cursor-pointer" onSelect={() => onEdit(item)}>
            <Pencil className="mr-2 size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11 cursor-pointer text-danger focus:text-danger" onSelect={() => onDelete(item)}>
            <Trash2 className="mr-2 size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  )
})
