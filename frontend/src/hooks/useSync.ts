import { useContext } from 'react'
import { SyncContext, type SyncContextValue } from '@/context/SyncContext'

/** What is waiting to upload, and the actions to submit or retry */
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used inside <SyncProvider>')
  }
  return context
}
