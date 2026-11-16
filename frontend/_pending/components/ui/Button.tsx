import React from 'react'
import { cn } from '../../utils/cn'

// --- Types ---

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

// --- Style maps ---

const variantClasses: Record<ButtonVariant, string> = {
  // Primary CTA — emerald brand colour
  primary:
    'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-600 border border-transparent',
  // Secondary — white background with emerald border
  outline:
    'bg-white text-emerald-700 border border-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-600',
  // Tertiary — no background, subtle hover
  ghost:
    'bg-transparent text-zinc-600 border border-transparent hover:bg-zinc-100 focus-visible:ring-zinc-400',
  // Destructive — red for delete / dangerous actions
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400 border border-transparent',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2 text-sm min-h-[40px]',
  lg: 'px-6 py-2.5 text-base min-h-[44px]', // 44px minimum touch target
}

// --- Component ---

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={cn(
        // Base styles shared by all variants
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        // Simple inline spinner — no library dependency
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
