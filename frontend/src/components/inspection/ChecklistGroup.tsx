import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ChecklistAnswer, ChecklistItem } from '@/types'
import { ChecklistItemRow } from './ChecklistItemRow'

interface ChecklistGroupProps {
  title: string
  items: ChecklistItem[]
  answers: Record<string, { result: ChecklistAnswer; notes: string }>
  onResult: (itemId: string, result: ChecklistAnswer) => void
  onNotes: (itemId: string, notes: string) => void
}

/** A heading ("Working condition", "2 of 3") over its questions. Tap the heading to fold the group away. */
export function ChecklistGroup({ title, items, answers, onResult, onNotes }: ChecklistGroupProps) {
  const [isOpen, setIsOpen] = useState(true)
  const answered = items.filter((item) => answers[item.itemId]).length
  const isDone = answered === items.length

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <h2>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex min-h-14 w-full items-center gap-3 px-4 text-left sm:px-5"
        >
          <span className="font-display text-lg font-semibold">{title}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', isDone ? 'bg-ok-soft text-ok' : 'bg-secondary text-muted-foreground')}>
            {answered} of {items.length}
          </span>
          <ChevronDown className={cn('ml-auto size-5 text-muted-foreground transition-transform duration-200 ease-snap', !isOpen && '-rotate-90')} aria-hidden="true" />
        </button>
      </h2>
      {isOpen && (
        <ul className="divide-y border-t">
          {items.map((item) => (
            <ChecklistItemRow
              key={item.itemId}
              item={item}
              answer={answers[item.itemId]}
              onResult={(result) => onResult(item.itemId, result)}
              onNotes={(notes) => onNotes(item.itemId, notes)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
