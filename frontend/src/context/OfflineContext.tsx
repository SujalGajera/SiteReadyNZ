import React, { createContext, useContext, useState, useEffect } from 'react'

// --- Context shape ---

interface OfflineContextValue {
  /** True when the browser has network access */
  isOnline: boolean
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined)

// --- Provider ---

interface OfflineProviderProps {
  children: React.ReactNode
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  // Initialise from the browser's current connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)

  useEffect(() => {
    // Listen for the browser's native online/offline events.
    // These fire when the network interface comes up or goes down.
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Clean up listeners when this provider unmounts (defensive practice)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <OfflineContext.Provider value={{ isOnline }}>
      {children}
    </OfflineContext.Provider>
  )
}

// --- Hook ---

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext)
  if (!ctx) {
    throw new Error('useOffline must be used inside <OfflineProvider>')
  }
  return ctx
}

export { OfflineContext }
