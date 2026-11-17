import { useMemo, useState } from 'react'
import { equipmentTypeLabels, statusDisplay } from '@/utils/statusCalculator'
import type { Equipment, EquipmentStatus } from '@/types'

export type SortOption = 'expiry' | 'urgency' | 'name' | 'location'
export type StatusFilter = EquipmentStatus | 'all'

export const sortOptionLabels: Record<SortOption, string> = {
  expiry: 'Soonest expiry',
  urgency: 'Most urgent',
  name: 'Name, A to Z',
  location: 'Location, A to Z',
}

/** How many items are in each state, for the readiness summary */
export interface EquipmentCounts {
  total: number
  ok: number
  due_soon: number
  overdue: number
  expired: number
}

export function countEquipment(equipment: Equipment[]): EquipmentCounts {
  const counts: EquipmentCounts = { total: equipment.length, ok: 0, due_soon: 0, overdue: 0, expired: 0 }
  for (const item of equipment) counts[item.status] += 1
  return counts
}

/** Share of items that are fully ready, 0 to 100. An empty list is 0, not a divide-by-zero. */
export function readinessPercent(counts: EquipmentCounts): number {
  return counts.total === 0 ? 0 : Math.round((counts.ok / counts.total) * 100)
}

function compareByOption(a: Equipment, b: Equipment, option: SortOption): number {
  switch (option) {
    case 'name':
      return a.name.localeCompare(b.name, 'en-NZ', { sensitivity: 'base' })
    case 'location':
      return a.location.localeCompare(b.location, 'en-NZ', { sensitivity: 'base' })
    case 'urgency':
      // Worst status first; items in the same state are ordered by how soon they expire
      return statusDisplay[a.status].severity - statusDisplay[b.status].severity || a.expiryDate.localeCompare(b.expiryDate)
    case 'expiry':
      return a.expiryDate.localeCompare(b.expiryDate)
  }
}

/** Search text, status filter and sort order for the equipment list */
export function useEquipmentFilters(equipment: Equipment[]) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('urgency')

  const visibleEquipment = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = equipment.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!query) return true
      // Search across everything a person might remember about an item
      const searchable = [item.name, item.location, item.serialNumber ?? '', equipmentTypeLabels[item.type]]
      return searchable.some((text) => text.toLowerCase().includes(query))
    })

    return [...filtered].sort((a, b) => compareByOption(a, b, sortOption))
  }, [equipment, search, statusFilter, sortOption])

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
  }

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all'

  return {
    visibleEquipment,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    clearFilters,
    hasActiveFilters,
  }
}
