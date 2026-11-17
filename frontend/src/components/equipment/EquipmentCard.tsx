import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { describeDaysUntil, formatDate } from '@/utils/dateHelpers'
import { equipmentTypeLabels } from '@/utils/statusCalculator'
import type { Equipment } from '@/types'
import type { EquipmentRowActions } from './EquipmentTable'
import { StatusBadge } from './StatusBadge'

interface EquipmentCardProps extends EquipmentRowActions {
  item: Equipment
}

/** Phone version of a table row: one tappable card per item */
export function EquipmentCard({ item, onEdit, onDelete }: EquipmentCardProps) {
  return (
    <li className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/equipment/${item._id}`} className="block truncate font-medium">
            {item.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {equipmentTypeLabels[item.type]} &middot; {item.location}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <p className="mt-3 text-sm">
        Expires <span className="font-medium tabular-nums">{formatDate(item.expiryDate)}</span>
        <span className="text-muted-foreground"> ({describeDaysUntil(item.expiryDate)})</span>
      </p>

      <div className="mt-3 flex gap-2 border-t pt-3">
        <Button variant="outline" size="sm" className="h-11 flex-1" onClick={() => onEdit(item)}>
          Edit
        </Button>
        <Button variant="outline" size="sm" className="h-11 flex-1 text-danger hover:text-danger" onClick={() => onDelete(item)}>
          Delete
        </Button>
      </div>
    </li>
  )
}
