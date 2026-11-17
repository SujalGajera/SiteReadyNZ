import { AnimatePresence } from 'motion/react'
import type { Equipment } from '@/types'
import { EquipmentRow, type EquipmentRowActions } from './EquipmentRow'

interface EquipmentListProps extends EquipmentRowActions {
  items: Equipment[]
}

/** The list of rows. AnimatePresence lets rows fade out when they are filtered away or deleted. */
export function EquipmentList({ items, onEdit, onDelete }: EquipmentListProps) {
  return (
    <ul className="space-y-2.5" aria-label="Equipment">
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item) => (
          <EquipmentRow key={item._id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </AnimatePresence>
    </ul>
  )
}
