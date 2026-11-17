import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sortOptionLabels, type SortOption, type StatusFilter } from '@/hooks/useEquipmentFilters'
import { statusDisplay } from '@/utils/statusCalculator'

interface EquipmentToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  sortOption: SortOption
  onSortOptionChange: (value: SortOption) => void
}

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'ok', label: statusDisplay.ok.label },
  { value: 'due_soon', label: statusDisplay.due_soon.label },
  { value: 'overdue', label: statusDisplay.overdue.label },
  { value: 'expired', label: statusDisplay.expired.label },
]

/** Search, status filter and sort order above the list (AGENT_RULES: every list has all three) */
export function EquipmentToolbar(props: EquipmentToolbarProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="Search equipment"
          aria-label="Search equipment"
          className="bg-card pl-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:flex">
        <Select value={props.statusFilter} onValueChange={(value) => props.onStatusFilterChange(value as StatusFilter)}>
          <SelectTrigger className="h-11 bg-card sm:w-[160px]" aria-label="Filter by status">
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
        <Select value={props.sortOption} onValueChange={(value) => props.onSortOptionChange(value as SortOption)}>
          <SelectTrigger className="h-11 bg-card sm:w-[170px]" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortOptionLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
