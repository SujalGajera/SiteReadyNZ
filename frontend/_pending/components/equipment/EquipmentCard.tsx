import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { StatusBadge } from './StatusBadge'
import { formatDate } from '../../utils/dateHelpers'
import type { Equipment } from '../../types'

interface EquipmentCardProps {
  equipment: Equipment
  onEdit: (equipment: Equipment) => void
  onDelete: (id: string) => void
}

/** Card showing a single piece of equipment with its key details and actions */
export function EquipmentCard({ equipment, onEdit, onDelete }: EquipmentCardProps) {
  // Human-readable type labels
  const typeLabels: Record<Equipment['type'], string> = {
    fire_extinguisher: 'Fire Extinguisher',
    first_aid: 'First Aid',
    aed: 'AED',
    safety_sign: 'Safety Sign',
    other: 'Other',
  }

  return (
    <Card className="flex flex-col gap-3">
      {/* Top row: name + type badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-800">{equipment.name}</h3>
        <Badge variant="neutral">{typeLabels[equipment.type]}</Badge>
      </div>

      {/* Detail rows */}
      <div className="flex flex-col gap-1 text-sm text-zinc-600">
        <span>
          <span className="font-medium text-zinc-700">Location: </span>
          {equipment.location}
        </span>
        <span>
          <span className="font-medium text-zinc-700">Expires: </span>
          {formatDate(equipment.expiryDate)}
        </span>
      </div>

      {/* Status + actions */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
        <StatusBadge status={equipment.status} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(equipment)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(equipment._id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}
