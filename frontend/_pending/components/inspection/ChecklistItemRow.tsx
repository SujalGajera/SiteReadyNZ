import { cn } from '../../utils/cn'
import type { ChecklistItem } from '../../types'

interface ChecklistItemRowProps {
  item: ChecklistItem
  itemNumber: number
  onChange: (itemId: string, field: keyof ChecklistItem, value: string | null) => void
}

/**
 * A single checklist row — exact wireframe match.
 * Minimum 44px touch targets on PASS / FAIL / Flag buttons per AGENT_RULES.md.
 */
export function ChecklistItemRow({ item, itemNumber, onChange }: ChecklistItemRowProps) {
  const isPass = item.result === 'pass'
  const isFail = item.result === 'fail'
  const isFlag = item.result === 'flag'

  return (
    <div className="border-b border-zinc-100 last:border-0">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Item number */}
        <span className="text-xs text-zinc-400 w-5 shrink-0 text-right">
          {itemNumber}
        </span>

        {/* Description */}
        <span className="flex-1 text-sm text-zinc-700">{item.description}</span>

        {/* Action buttons — minimum 44x44px touch targets */}
        <div className="flex gap-2 shrink-0">
          {/* PASS button */}
          <button
            type="button"
            onClick={() => onChange(item.itemId, 'result', isPass ? 'not_checked' : 'pass')}
            className={cn(
              'min-w-[60px] min-h-[44px] px-3 rounded-md text-sm font-medium border transition-colors',
              isPass
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-green-600 border-green-600 hover:bg-green-50'
            )}
            aria-pressed={isPass}
          >
            {isPass ? '✓ Pass' : 'Pass'}
          </button>

          {/* FAIL button */}
          <button
            type="button"
            onClick={() => onChange(item.itemId, 'result', isFail ? 'not_checked' : 'fail')}
            className={cn(
              'min-w-[60px] min-h-[44px] px-3 rounded-md text-sm font-medium border transition-colors',
              isFail
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-red-500 border-red-500 hover:bg-red-50'
            )}
            aria-pressed={isFail}
          >
            {isFail ? '✕ Fail' : 'Fail'}
          </button>

          {/* Flag button */}
          <button
            type="button"
            onClick={() => onChange(item.itemId, 'result', isFlag ? 'not_checked' : 'flag')}
            className={cn(
              'min-w-[60px] min-h-[44px] px-3 rounded-md text-sm font-medium border transition-colors',
              isFlag
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-amber-600 border-amber-400 hover:bg-amber-50'
            )}
            aria-pressed={isFlag}
          >
            Flag
          </button>
        </div>
      </div>

      {/* FAIL sub-row — only shown when this item is marked as failed */}
      {isFail && (
        <div className="bg-amber-50 border-l-4 border-amber-400 mx-4 mb-3 px-4 py-3 rounded-r-md flex flex-col gap-3">
          {/* Photo evidence notice */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-amber-700 font-medium">
              Photo Evidence Required
            </span>
            <button
              type="button"
              className="text-sm text-emerald-700 font-medium underline underline-offset-2 hover:text-emerald-800"
            >
              Add Photo
            </button>
          </div>

          {/* Severity selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600 mr-1">Severity:</span>
            {(['low', 'medium', 'critical'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onChange(item.itemId, 'severity', level)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium border capitalize transition-colors',
                  item.severity === level
                    ? 'bg-zinc-700 text-white border-zinc-700'
                    : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'
                )}
              >
                {level === 'medium' ? 'Med' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
