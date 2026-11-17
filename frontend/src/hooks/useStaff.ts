import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as staffApi from '@/services/staffApi'
import { getErrorMessage } from '@/services/api'
import type { User } from '@/types'

/** Loads the manager's staff list and adds new staff. Also owns the state of the add slide-over. */
export function useStaff() {
  const [staff, setStaff] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setStaff(await staffApi.fetchStaff())
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load your staff list.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  /** Throws on failure so the form can show the server's message (for example "email already exists") */
  const addStaff = useCallback(async (details: staffApi.NewStaffDetails) => {
    const created = await staffApi.createStaff(details)
    setStaff((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'en-NZ')))
    toast.success(`${created.name} can now sign in`)
    setIsFormOpen(false)
  }, [])

  return {
    staff,
    isLoading,
    loadError,
    reload,
    addStaff,
    isFormOpen,
    openForm: () => setIsFormOpen(true),
    closeForm: () => setIsFormOpen(false),
  }
}
