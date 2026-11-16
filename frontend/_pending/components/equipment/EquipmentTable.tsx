import { useState, useMemo } from 'react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { StatusBadge } from './StatusBadge'
import { formatDate } from '../../utils/dateHelpers'
import type { Equipment } from '../../types'

interface EquipmentTableProps {
  equipment: Equipment[]
  onEdit: (equipment: Equipment) => void
  onDelete: (id: string) => void
}

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ok', label: 'OK' },
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'expired', label: 'Expired' },
]

const typeLabels: Record<Equipment['type'], string> = {
  fire_extinguisher: 'Fire Extinguisher',
  first_aid: 'First Aid',
  aed: 'AED',
  safety_sign: 'Safety Sign',
  other: 'Other',
}

/**
 * Searchable, filterable equipment table.
 * Search and filter are client-side — no extra API call needed.
 */
export function EquipmentTable({ equipment, onEdit, onDelete }: EquipmentTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Apply both search and status filter to the equipment list
  const filtered = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch =
        search === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [equipment, search, statusFilter])

  return (
    <div className="flex flex-col gap-4">
      {/* Search and filter bar */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            label="Search"
            placeholder="Search by name, location, or serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            label="Filter by status"
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {['Name', 'Type', 'Location', 'Expiry Date', 'Status', 'Actions'].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-400">
                  {equipment.length === 0
                    ? 'No equipment found. Add your first item.'
                    : 'No equipment matches your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item._id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-800">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{typeLabels[item.type]}</td>
                  <td className="px-4 py-3 text-zinc-600">{item.location}</td>
                  <td className="px-4 py-3 text-zinc-600">{formatDate(item.expiryDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(item._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      {filtered.length > 0 && (
        <p className="text-xs text-zinc-400">
          Showing {filtered.length} of {equipment.length} items
        </p>
      )}
    </div>
  )
}
