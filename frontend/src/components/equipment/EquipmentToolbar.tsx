import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { StatusFilter } from '@/hooks/useEquipmentFilters'

interface EquipmentToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
}

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'ok', label: 'OK' },
  { value: 'due_soon', label: 'Due soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'expired', label: 'Expired' },
  { value: 'attention', label: 'Needs action' },
]

/** Search box and status filter above the table (AGENT_RULES: every table has both) */
export function EquipmentToolbar({ search, onSearchChange, statusFilter, onStatusFilterChange }: EquipmentToolbarProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, location or serial number"
          aria-label="Search equipment"
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}>
        <SelectTrigger className="h-11 sm:w-[180px]" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
