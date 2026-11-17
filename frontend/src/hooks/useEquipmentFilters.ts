import { useMemo, useState } from 'react'
import { equipmentTypeLabels, statusDisplay } from '@/utils/statusCalculator'
import type { Equipment, EquipmentStatus } from '@/types'

export type SortKey = 'name' | 'location' | 'expiryDate' | 'status'
export type SortDirection = 'asc' | 'desc'
export type StatusFilter = EquipmentStatus | 'all' | 'attention'

/** What the stats row shows */
export interface EquipmentCounts {
  total: number
  ok: number
  dueSoon: number
  /** Overdue plus expired: everything that needs action now */
  needsAction: number
}

export function countEquipment(equipment: Equipment[]): EquipmentCounts {
  return {
    total: equipment.length,
    ok: equipment.filter((item) => item.status === 'ok').length,
    dueSoon: equipment.filter((item) => item.status === 'due_soon').length,
    needsAction: equipment.filter((item) => item.status === 'overdue' || item.status === 'expired').length,
  }
}

function compare(a: Equipment, b: Equipment, key: SortKey): number {
  switch (key) {
    case 'name':
      return a.name.localeCompare(b.name, 'en-NZ', { sensitivity: 'base' })
    case 'location':
      return a.location.localeCompare(b.location, 'en-NZ', { sensitivity: 'base' })
    case 'expiryDate':
      return a.expiryDate.localeCompare(b.expiryDate)
    case 'status':
      return statusDisplay[a.status].severity - statusDisplay[b.status].severity
  }
}

/** Search text, status filter and column sorting for the equipment table */
export function useEquipmentFilters(equipment: Equipment[]) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  // Default: soonest expiry first, the same order the API uses
  const [sortKey, setSortKey] = useState<SortKey>('expiryDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const visibleEquipment = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = equipment.filter((item) => {
      if (statusFilter === 'attention') {
        if (item.status !== 'overdue' && item.status !== 'expired') return false
      } else if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      if (!query) return true
      // Search across everything a person might remember about an item
      const searchable = [item.name, item.location, item.serialNumber ?? '', equipmentTypeLabels[item.type]]
      return searchable.some((text) => text.toLowerCase().includes(query))
    })

    const direction = sortDirection === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => compare(a, b, sortKey) * direction)
  }, [equipment, search, statusFilter, sortKey, sortDirection])

  /** Clicking the active column flips direction; clicking a new column sorts it ascending */
  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

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
    sortKey,
    sortDirection,
    toggleSort,
    clearFilters,
    hasActiveFilters,
  }
}
