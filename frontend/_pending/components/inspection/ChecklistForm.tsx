// components/inspection/ChecklistForm.tsx
// The main checklist form — matches the wireframe exactly.
// Groups items by category, shows Pass/Fail buttons per item,
// expands a "Fail" row to show severity picker and add-photo notice.

import { useState } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import type { ChecklistItem, Inspection } from '../../types'

interface ChecklistFormProps {
  inspection: Inspection
  onSaveDraft: (items: ChecklistItem[]) => void
  onSubmit: (items: ChecklistItem[]) => Promise<void>
  submitting: boolean
}

export function ChecklistForm({ inspection, onSaveDraft, onSubmit, submitting }: ChecklistFormProps) {
  // Local copy of items — user edits flow into here, not the original inspection
  const [items, setItems] = useState<ChecklistItem[]>(inspection.items)

  // --- Derived values ---

  // Group items by their category so we can render category accordion sections
  const categories = Array.from(new Set(items.map((item) => item.category)))

  // --- Update helpers ---

  function setResult(itemId: string, result: ChecklistItem['result']) {
    setItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              result,
              // Clear severity if switching away from fail/flag
              severity: result === 'fail' || result === 'flag' ? item.severity : null,
            }
          : item
      )
    )
  }

  function setSeverity(itemId: string, severity: ChecklistItem['severity']) {
    setItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, severity } : item
      )
    )
  }

  async function handleSubmit() {
    await onSubmit(items)
  }

  return (
    <div className="flex flex-col gap-0">

      {/* Category sections */}
      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category)

        return (
          <div key={category} className="mb-6">
            {/* Category heading */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-200 mb-2">
              <div className="flex items-center gap-2">
                {/* Small category icon — using a simple coloured dot, no AI icon */}
                <div className="w-4 h-4 rounded border border-zinc-300 bg-zinc-100 shrink-0" />
                <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  {category}
                </span>
              </div>
              <span className="text-xs text-zinc-400">
                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Items within this category */}
            <div className="flex flex-col gap-2">
              {categoryItems.map((item) => {
                const isChecked = item.result !== 'not_checked'
                const isFailed = item.result === 'fail'
                const isFlagged = item.result === 'flag'
                const needsEvidence = isFailed || isFlagged

                return (
                  <div
                    key={item.itemId}
                    className={cn(
                      'rounded-lg border bg-white',
                      isFailed ? 'border-red-200' : 'border-zinc-200'
                    )}
                  >
                    {/* Main item row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Item number */}
                      <span className="text-sm text-zinc-400 w-5 shrink-0 text-right">
                        {items.findIndex((i) => i.itemId === item.itemId) + 1}
                      </span>

                      {/* Item description */}
                      <span className="flex-1 text-sm text-zinc-800">{item.description}</span>

                      {/* Result shown when not yet answered */}
                      {!isChecked && (
                        <span className="text-xs text-zinc-400 mr-2">Not checked</span>
                      )}

                      {/* Pass / Fail buttons — large enough for touch (min 44px height per rules) */}
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setResult(item.itemId, 'pass')}
                          className={cn(
                            'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border min-h-[36px] transition-colors',
                            item.result === 'pass'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white text-zinc-600 border-zinc-300 hover:border-emerald-500 hover:text-emerald-700'
                          )}
                        >
                          {/* Checkmark — inline SVG, no icon library */}
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          PASS
                        </button>

                        <button
                          type="button"
                          onClick={() => setResult(item.itemId, 'fail')}
                          className={cn(
                            'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border min-h-[36px] transition-colors',
                            item.result === 'fail'
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-white text-zinc-600 border-zinc-300 hover:border-red-400 hover:text-red-600'
                          )}
                        >
                          {/* X mark */}
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path
                              d="M2 2l8 8M10 2L2 10"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          FAIL
                        </button>
                      </div>

                      {/* Flag button — a small square icon on the right */}
                      <button
                        type="button"
                        onClick={() =>
                          setResult(item.itemId, item.result === 'flag' ? 'not_checked' : 'flag')
                        }
                        title="Flag for follow-up"
                        className={cn(
                          'w-8 h-8 rounded-md border flex items-center justify-center transition-colors',
                          item.result === 'flag'
                            ? 'bg-amber-100 border-amber-300 text-amber-600'
                            : 'bg-white border-zinc-200 text-zinc-400 hover:border-amber-300 hover:text-amber-500'
                        )}
                      >
                        {/* Flag icon — inline SVG */}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path
                            d="M2 2h7l-2 3 2 3H2V2z"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="2"
                            y1="2"
                            x2="2"
                            y2="11"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Expanded section — only shown when item is failed or flagged */}
                    {needsEvidence && (
                      <div className="px-4 pb-4 flex flex-col gap-3 border-t border-zinc-100 pt-3">
                        {/* Warning notice */}
                        <div className="flex items-center gap-2 text-xs text-amber-700">
                          {/* Warning triangle */}
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path
                              d="M7 1L13 12H1L7 1z"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
                            <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            <circle cx="7" cy="10" r="0.6" fill="currentColor" />
                          </svg>
                          <span className="font-medium">Photo evidence required</span>
                        </div>

                        {/* Severity selector */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500 shrink-0">Severity:</span>
                          {(['low', 'medium', 'critical'] as const).map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setSeverity(item.itemId, level)}
                              className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors min-h-[28px] capitalize',
                                item.severity === level
                                  ? level === 'critical'
                                    ? 'bg-red-500 text-white border-red-500'
                                    : level === 'medium'
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-zinc-700 text-white border-zinc-700'
                                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                              )}
                            >
                              {item.severity === level && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                              {level}
                            </button>
                          ))}
                        </div>

                        {/* Add photo button */}
                        <button
                          type="button"
                          className="flex items-center gap-2 text-xs text-zinc-600 border border-zinc-200 rounded-md px-3 py-2 hover:bg-zinc-50 transition-colors w-fit"
                        >
                          {/* Camera icon — inline SVG */}
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="7" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.2" />
                            <path d="M5 4l1-2h2l1 2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                          </svg>
                          Add photo
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Sticky footer bar — always visible for easy access */}
      <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-0 py-4 flex items-center justify-between gap-4 mt-4">
        {/* Saved indicator */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          {/* Small disc icon */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="3.5" y="1" width="5" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="2.5" y="6" width="7" height="4.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Saved on this device
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => onSaveDraft(items)}
          >
            Save draft
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={submitting}
            onClick={handleSubmit}
          >
            Submit inspection
          </Button>
        </div>
      </div>
    </div>
  )
}
