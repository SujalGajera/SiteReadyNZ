import { useEffect, useState } from 'react'
import { animate, motion } from 'motion/react'
import { cn } from '@/utils/cn'

interface ReadinessRingProps {
  /** 0 to 100 */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  /** Colour of the track behind the arc */
  trackClassName?: string
  /** Colour of the arc itself */
  arcClassName?: string
  /** Show the number in the middle */
  showValue?: boolean
}

/**
 * A ring that fills to `value` percent, with the number counting up inside it.
 * The arc is animated with stroke-dashoffset (a transform-like paint change, no layout).
 */
export function ReadinessRing({
  value,
  size = 132,
  strokeWidth = 11,
  className,
  trackClassName = 'text-primary/10',
  arcClassName = 'text-primary',
  showValue = true,
}: ReadinessRingProps) {
  const [displayed, setDisplayed] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Count the number up to its target every time the value changes
  useEffect(() => {
    const controls = animate(displayed, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayed(Math.round(latest)),
    })
    return () => controls.stop()
    // `displayed` is deliberately left out: it is the animation's starting point, not a trigger
  }, [value])

  return (
    <div className={cn('relative shrink-0', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={trackClassName} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={arcClassName}
        />
      </svg>
      {showValue && (
        <span className="absolute inset-0 flex items-center justify-center font-display font-semibold tabular-nums">
          <span className="text-[34px] leading-none">{displayed}</span>
          <span className="ml-0.5 mt-1 text-sm text-muted-foreground">%</span>
        </span>
      )}
    </div>
  )
}
