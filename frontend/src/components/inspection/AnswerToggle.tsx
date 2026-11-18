import { useId, type KeyboardEvent } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/utils/cn'
import type { ChecklistAnswer } from '@/types'

const options: { value: ChecklistAnswer; label: string; selected: string }[] = [
  { value: 'pass', label: 'Pass', selected: 'bg-ok text-primary-foreground' },
  { value: 'fail', label: 'Fail', selected: 'bg-danger text-destructive-foreground' },
  { value: 'flag', label: 'Flag', selected: 'bg-kowhai text-primary' },
]

interface AnswerToggleProps {
  /** Describes the question for screen readers */
  label: string
  value: ChecklistAnswer | undefined
  onChange: (value: ChecklistAnswer) => void
}

/**
 * Pass / Fail / Flag. Each button is 48px tall and a third of the width, well above the 44px
 * minimum touch target, because this is tapped with gloves and one thumb.
 * It behaves like a radio group: one answer, and the arrow keys move between the three.
 */
export function AnswerToggle({ label, value, onChange }: AnswerToggleProps) {
  const groupId = useId()

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = options[(index + step + options.length) % options.length]
    onChange(next.value)
    document.getElementById(`${groupId}-${next.value}`)?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
      {options.map((option, index) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            id={`${groupId}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            // Only one button is a tab stop, like a native radio group
            tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'relative h-12 min-w-[64px] rounded-lg text-sm font-semibold transition-colors duration-150 active:scale-[0.97]',
              isSelected ? '' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {/* One highlight shared by the three buttons, so it slides to the chosen answer */}
            {isSelected && (
              <motion.span
                layoutId={`answer-pill-${groupId}`}
                className={cn('absolute inset-0 rounded-lg shadow-sm', option.selected)}
                transition={{ type: 'spring', stiffness: 600, damping: 42 }}
              />
            )}
            <span className={cn('relative', isSelected && option.selected.split(' ')[1])}>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
