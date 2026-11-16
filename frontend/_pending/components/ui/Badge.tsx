import React from 'react'
import { cn } from '../../utils/cn'

// --- Types ---

type BadgeVariant =
  | 'ok'
  | 'due_soon'
  | 'overdue'
  | 'expired'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'neutral'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

// --- Style maps ---

const variantClasses: Record<BadgeVariant, string> = {
  ok: 'bg-green-100 text-green-700',
  due_soon: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-600',
  expired: 'bg-red-100 text-red-600',
  pending: 'bg-zinc-100 text-zinc-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  neutral: 'bg-zinc-100 text-zinc-600',
}

// --- Component ---

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        // Pill shape, tight letter-spacing — consistent with AGENT_RULES.md
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
