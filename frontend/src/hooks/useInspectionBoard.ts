import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { assignInspection, deleteInspection, fetchAllInspections } from '@/services/inspectionApi'
import { fetchEquipment } from '@/services/equipmentApi'
import { fetchStaff } from '@/services/staffApi'
import { getErrorMessage } from '@/services/api'
import { useIsMounted } from '@/hooks/useIsMounted'
import type { AssignInspectionValues, Equipment, Inspection, User } from '@/types'

/**
 * The manager's inspections page: every inspection in the workspace, plus the equipment and staff
 * lists the "assign" form needs, the state of its slide-over, and the delete confirmation.
 */
export function useInspectionBoard() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMounted = useIsMounted()

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      // The three requests do not depend on each other, so they run together
      const [loadedInspections, loadedEquipment, loadedStaff] = await Promise.all([fetchAllInspections(), fetchEquipment(), fetchStaff()])
      if (!isMounted()) return
      setInspections(loadedInspections)
      setEquipment(loadedEquipment)
      setStaff(loadedStaff)
    } catch (error) {
      if (isMounted()) setLoadError(getErrorMessage(error, 'Could not load inspections.'))
    } finally {
      if (isMounted()) setIsLoading(false)
    }
  }, [isMounted])

  useEffect(() => {
    void reload()
  }, [reload])

  /** Throws on failure so the form can show the server's message */
  const assign = useCallback(async (values: AssignInspectionValues) => {
    const created = await assignInspection(values)
    setInspections((current) => [...current, created].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)))
    const staffName = typeof created.assignedStaffId === 'string' ? 'staff' : created.assignedStaffId.name
    toast.success(`${created.equipmentId.name} assigned to ${staffName}`)
    setIsFormOpen(false)
  }, [])

  /** Deletes the inspection the manager confirmed. The dialog stays open until the server answers. */
  const confirmDelete = useCallback(async () => {
    if (!inspectionToDelete) return
    setIsDeleting(true)
    try {
      await deleteInspection(inspectionToDelete._id)
      if (!isMounted()) return
      setInspections((current) => current.filter((inspection) => inspection._id !== inspectionToDelete._id))
      toast.success(`${inspectionToDelete.equipmentId.name} check deleted`)
      setInspectionToDelete(null)
    } catch (error) {
      // For example "A completed inspection is kept as a record", or someone else already deleted it
      toast.error(getErrorMessage(error, 'Could not delete that check.'))
    } finally {
      if (isMounted()) setIsDeleting(false)
    }
  }, [inspectionToDelete, isMounted])

  return {
    inspections,
    equipment,
    staff,
    isLoading,
    loadError,
    reload,
    assign,
    isFormOpen,
    openForm: () => setIsFormOpen(true),
    closeForm: () => setIsFormOpen(false),
    inspectionToDelete,
    requestDelete: setInspectionToDelete,
    cancelDelete: () => setInspectionToDelete(null),
    confirmDelete,
    isDeleting,
  }
}
