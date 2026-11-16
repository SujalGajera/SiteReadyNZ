// pages/manager/Dashboard.tsx — Equipment Dashboard for the Manager role
// Shows summary stats, a searchable/filterable equipment table, and an Add Equipment button.
// All data fetching is handled by the useEquipment hook — this component only renders.

import { useState } from 'react'
import { useEquipment } from '../../hooks/useEquipment'
import { StatsCards } from '../../components/equipment/StatsCards'
import { StatusBadge } from '../../components/equipment/StatusBadge'
import { EquipmentForm } from '../../components/equipment/EquipmentForm'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/dateHelpers'
import type { Equipment } from '../../types'

// Status filter options shown in the dropdown
const statusFilterOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'ok', label: 'OK' },
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'expired', label: 'Expired' },
]

// Human-readable equipment type labels
const typeLabels: Record<Equipment['type'], string> = {
  fire_extinguisher: 'Fire Extinguisher',
  first_aid: 'First Aid Kit',
  aed: 'AED',
  safety_sign: 'Safety Sign',
  other: 'Other',
}

export default function DashboardPage() {
  const { equipment, loading, error, createEquipment, updateEquipment, deleteEquipment } =
    useEquipment()

  // --- Local UI state ---
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // --- Filtering logic ---
  const filtered = equipment.filter((item) => {
    // Apply search — matches name, location, or serial number
    const matchesSearch =
      search === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(search.toLowerCase())

    // Apply status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // --- Handlers ---

  async function handleAdd(data: Omit<Equipment, '_id' | 'status' | 'lastInspectedAt'>) {
    await createEquipment(data)
    setIsAddModalOpen(false)
  }

  async function handleEdit(data: Omit<Equipment, '_id' | 'status' | 'lastInspectedAt'>) {
    if (!editingEquipment) return
    await updateEquipment(editingEquipment._id, data)
    setEditingEquipment(null)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteEquipment(id)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  // --- Render states ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-800">Equipment</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            All emergency equipment registered at your site.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          Add equipment
        </Button>
      </div>

      {/* Summary stats */}
      <StatsCards equipment={equipment} />

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, location or serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Equipment table */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</span>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</span>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Location</span>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Expires</span>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</span>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</span>
        </div>

        {/* Empty state — shown when no equipment matches the current filter */}
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">No equipment found</p>
            <p className="text-sm text-zinc-500 mt-1">
              {search || statusFilter !== 'all'
                ? 'Try clearing the search or filter.'
                : 'Add your first piece of equipment using the button above.'}
            </p>
          </div>
        )}

        {/* Table rows */}
        {filtered.map((item) => (
          <div
            key={item._id}
            className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
          >
            {/* Name + serial */}
            <div>
              <p className="text-sm font-medium text-zinc-800">{item.name}</p>
              <p className="text-xs text-zinc-400">{item.serialNumber}</p>
            </div>

            {/* Type */}
            <span className="text-sm text-zinc-600">{typeLabels[item.type]}</span>

            {/* Location */}
            <span className="text-sm text-zinc-600">{item.location}</span>

            {/* Expiry date */}
            <span className="text-sm text-zinc-600">{formatDate(item.expiryDate)}</span>

            {/* Status badge */}
            <StatusBadge status={item.status} />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEquipment(item)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteId(item._id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Equipment modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add equipment"
      >
        <EquipmentForm onSubmit={handleAdd} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>

      {/* Edit Equipment modal */}
      <Modal
        isOpen={editingEquipment !== null}
        onClose={() => setEditingEquipment(null)}
        title="Edit equipment"
      >
        {editingEquipment && (
          <EquipmentForm
            initialData={editingEquipment}
            onSubmit={handleEdit}
            onCancel={() => setEditingEquipment(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete equipment"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-700">
            Are you sure you want to delete this equipment record? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deletingId !== null}
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
