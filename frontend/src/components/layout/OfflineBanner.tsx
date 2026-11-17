import { AnimatePresence, motion } from 'motion/react'
import { CloudOff } from 'lucide-react'
import { useOffline } from '@/context/OfflineContext'

/**
 * Kowhai-coloured strip that slides down when the connection drops and away when it returns.
 * No dismiss button on purpose (AGENT_RULES): the user should always be able to see that they
 * are working offline. Only transform and opacity are animated, so nothing reflows.
 */
export function OfflineBanner() {
  const { isOnline } = useOffline()

  return (
    <AnimatePresence initial={false}>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          role="status"
          aria-live="polite"
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          // Sits just under the phone header (h-14); on desktop there is no header so it hugs the top
          className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-x-6 gap-y-0.5 border-b border-kowhai/40 bg-kowhai-soft px-4 py-2.5 text-sm text-warn md:top-0 md:px-8"
        >
          <span className="flex items-center gap-2 font-semibold">
            <CloudOff className="size-4 shrink-0" aria-hidden="true" />
            You are offline
          </span>
          <span>Your work is saved on this device and uploads when you reconnect.</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
