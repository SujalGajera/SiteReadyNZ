import { Badge } from '../ui/Badge'
import type { Equipment } from '../../types'

interface StatusBadgeProps {
  status: Equipment['status']
}

/** Maps equipment status values to human-readable labels and Badge variants */
export function StatusBadge({ status }: StatusBadgeProps) {
  const labels: Record<Equipment['status'], string> = {
    ok: 'OK',
    due_soon: 'Due Soon',
    overdue: 'Overdue',
    expired: 'Expired',
  }

  return <Badge variant={status}>{labels[status]}</Badge>
}
