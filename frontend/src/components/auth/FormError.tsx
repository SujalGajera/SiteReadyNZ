import { AnimatePresence, motion } from 'framer-motion'

/** A form-level problem (wrong password, server down). Fades in so it is noticed but not jarring. */
export function FormError({ message }: { message?: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key={message}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
