import { cn } from '../../utils/cn'

interface ProgressBarProps {
  /** 0–100 */
  value: number
  label?: string
  className?: string
}

/** Visual progress bar with percentage label */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  // Clamp value between 0 and 100 so the bar never overflows
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('w-full', className)}>
      {(label !== undefined || clamped !== undefined) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs text-zinc-500">{label}</span>
          )}
          <span className="text-xs font-medium text-zinc-700 ml-auto">
            {clamped}%
          </span>
        </div>
      )}
      {/* Track */}
      <div className="w-full bg-zinc-200 rounded-full h-2">
        {/* Fill — emerald brand colour */}
        <div
          className="bg-emerald-700 h-2 rounded-full transition-all duration-300"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
