import { motion } from 'motion/react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/cn'
import type { ChecklistAnswer, ChecklistItem } from '@/types'
import { AnswerToggle } from './AnswerToggle'

interface ChecklistItemRowProps {
  item: ChecklistItem
  answer: { result: ChecklistAnswer; notes: string } | undefined
  onResult: (result: ChecklistAnswer) => void
  onNotes: (notes: string) => void
}

/** One question: the wording, the three-way answer, and a note box that appears for Fail and Flag */
export function ChecklistItemRow({ item, answer, onResult, onNotes }: ChecklistItemRowProps) {
  const needsNote = answer !== undefined && answer.result !== 'pass'
  const noteMissing = needsNote && answer.notes.trim() === ''

  return (
    <li className="space-y-3 px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium leading-snug">{item.description}</p>
        {item.severity === 'critical' && (
          <span className="mt-0.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Critical
          </span>
        )}
      </div>

      <AnswerToggle label={item.description} value={answer?.result} onChange={onResult} />

      {needsNote && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
          <label className="mb-1 block text-[13px] font-medium" htmlFor={`note-${item.itemId}`}>
            What did you find? <span className="text-muted-foreground">(needed for {answer.result === 'fail' ? 'Fail' : 'Flag'})</span>
          </label>
          <Textarea
            id={`note-${item.itemId}`}
            value={answer.notes}
            maxLength={500}
            rows={2}
            onChange={(event) => onNotes(event.target.value)}
            aria-invalid={noteMissing || undefined}
            className={cn('bg-background text-base md:text-sm', noteMissing && 'border-warn')}
          />
        </motion.div>
      )}
    </li>
  )
}
