import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { assignInspection, fetchAllInspections } from '@/services/inspectionApi'
import { fetchEquipment } from '@/services/equipmentApi'
import { fetchStaff } from '@/services/staffApi'
import { getErrorMessage } from '@/services/api'
import type { AssignInspectionValues, Equipment, Inspection, User } from '@/types'

/**
 * The manager's inspections page: every inspection in the workspace, plus the equipment and staff
 * lists the "assign" form needs, and the state of its slide-over.
 */
export function useInspectionBoard() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      // The three requests do not depend on each other, so they run together
      const [loadedInspections, loadedEquipment, loadedStaff] = await Promise.all([fetchAllInspections(), fetchEquipment(), fetchStaff()])
      setInspections(loadedInspections)
      setEquipment(loadedEquipment)
      setStaff(loadedStaff)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load inspections.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

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
  }
}
