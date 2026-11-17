import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useEquipment } from '@/hooks/useEquipment'
import { countEquipment, useEquipmentFilters } from '@/hooks/useEquipmentFilters'
import { getErrorMessage } from '@/services/api'
import type { Equipment, EquipmentFormValues } from '@/types'

/**
 * Everything the equipment dashboard page needs: the data, the filters, and the state of the
 * add/edit slide-over and the delete confirmation. The page itself only lays things out.
 */
export function useEquipmentDashboard() {
  const data = useEquipment()
  const filters = useEquipmentFilters(data.equipment)
  const counts = useMemo(() => countEquipment(data.equipment), [data.equipment])

  // Slide-over: `editingItem` is kept after closing so the content does not flip to "Add" mid-animation
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | null>(null)

  const [itemToDelete, setItemToDelete] = useState<Equipment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openAddForm() {
    setEditingItem(null)
    setIsSheetOpen(true)
  }

  function openEditForm(item: Equipment) {
    setEditingItem(item)
    setIsSheetOpen(true)
  }

  function closeForm() {
    setIsSheetOpen(false)
  }

  /** Throws on failure so the form can show the server's message under the fields */
  async function saveEquipment(values: EquipmentFormValues) {
    if (editingItem) {
      await data.changeEquipment(editingItem._id, values)
      toast.success(`${values.name} updated`)
    } else {
      await data.addEquipment(values)
      toast.success(`${values.name} added`)
    }
    setIsSheetOpen(false)
  }

  async function confirmDelete() {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await data.removeEquipment(itemToDelete._id)
      toast.success(`${itemToDelete.name} deleted`)
      setItemToDelete(null)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete that item.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    ...data,
    ...filters,
    counts,
    isSheetOpen,
    editingItem,
    openAddForm,
    openEditForm,
    closeForm,
    saveEquipment,
    itemToDelete,
    requestDelete: setItemToDelete,
    cancelDelete: () => setItemToDelete(null),
    confirmDelete,
    isDeleting,
  }
}
