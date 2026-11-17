import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/utils/cn'
import { describeDaysUntil, formatDate } from '@/utils/dateHelpers'
import { equipmentTypeLabels } from '@/utils/statusCalculator'
import type { SortDirection, SortKey } from '@/hooks/useEquipmentFilters'
import type { Equipment } from '@/types'
import { StatusBadge } from './StatusBadge'

export interface EquipmentRowActions {
  onEdit: (item: Equipment) => void
  onDelete: (item: Equipment) => void
}

interface EquipmentTableProps extends EquipmentRowActions {
  items: Equipment[]
  sortKey: SortKey
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
}

interface SortableHeadProps {
  label: string
  column: SortKey
  sortKey: SortKey
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
}

/** Column header that sorts the table. aria-sort tells screen readers which column is sorted. */
function SortableHead({ label, column, sortKey, sortDirection, onSort }: SortableHeadProps) {
  const isActive = column === sortKey
  const Arrow = sortDirection === 'asc' ? ArrowUp : ArrowDown

  return (
    <TableHead aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-sm text-xs font-semibold uppercase tracking-wider hover:text-foreground',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
        <Arrow className={cn('size-3.5', !isActive && 'invisible')} aria-hidden="true" />
      </button>
    </TableHead>
  )
}

/** Desktop and tablet view. Phones use EquipmentCard instead. */
export function EquipmentTable({ items, sortKey, sortDirection, onSort, onEdit, onDelete }: EquipmentTableProps) {
  const sortProps = { sortKey, sortDirection, onSort }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead label="Equipment" column="name" {...sortProps} />
          <SortableHead label="Location" column="location" {...sortProps} />
          <SortableHead label="Expires" column="expiryDate" {...sortProps} />
          <SortableHead label="Status" column="status" {...sortProps} />
          <TableHead className="w-[140px]">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item._id} className="group">
            <TableCell>
              <Link to={`/equipment/${item._id}`} className="font-medium hover:text-primary hover:underline underline-offset-4">
                {item.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {equipmentTypeLabels[item.type]}
                {item.serialNumber ? ` \u00b7 ${item.serialNumber}` : ''}
              </p>
            </TableCell>
            <TableCell className="text-muted-foreground">{item.location}</TableCell>
            <TableCell>
              <span className="tabular-nums">{formatDate(item.expiryDate)}</span>
              <p className="text-xs text-muted-foreground">{describeDaysUntil(item.expiryDate)}</p>
            </TableCell>
            <TableCell>
              <StatusBadge status={item.status} />
            </TableCell>
            <TableCell className="text-right">
              {/* Actions fade in on hover for mouse users but stay visible for keyboard focus and touch */}
              <div className="flex justify-end gap-1 opacity-70 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(item)} aria-label={`Delete ${item.name}`}>
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
