import { motion } from 'motion/react'
import { contourPaths, CONTOUR_VIEWBOX } from '@/assets/contours'
import { cn } from '@/utils/cn'

interface ContourBackdropProps {
  className?: string
  /** Draw the lines in one after another when the page loads */
  animate?: boolean
  /** Pick every Nth line, to make the pattern lighter on small decorative uses */
  every?: number
}

/**
 * Topographic contour lines, the signature texture of the app. They echo the mountains in the
 * logo. The artwork is generated from an invented height map (see assets/contours.ts).
 * It is decorative, so it is hidden from screen readers.
 */
export function ContourBackdrop({ className, animate = false, every = 1 }: ContourBackdropProps) {
  const lines = contourPaths.filter((_, index) => index % every === 0)

  return (
    <svg
      viewBox={CONTOUR_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      className={cn('pointer-events-none', className)}
    >
      {lines.map((path, index) =>
        animate ? (
          <motion.path
            key={index}
            d={path}
            stroke="currentColor"
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : (
          <path key={index} d={path} stroke="currentColor" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        )
      )}
    </svg>
  )
}
