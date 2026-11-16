import React from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

/**
 * Labelled text input with inline error display.
 * Always shows a visible label (never placeholder-only) per AGENT_RULES.md.
 */
export function Input({ label, error, className, id, ...props }: InputProps) {
  // Generate a stable id from the label if one isn't provided, so the label
  // "for" attribute links correctly for accessibility
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-md border px-3 py-2 text-sm text-zinc-800',
          'placeholder:text-zinc-400',
          'focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-1',
          'transition-colors duration-150',
          // Red border signals validation error
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-zinc-200 focus:border-emerald-600',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
