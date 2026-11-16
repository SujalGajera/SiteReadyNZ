import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility that combines clsx (conditional class joining) with tailwind-merge
 * (removes duplicate/conflicting Tailwind classes).
 *
 * Usage: cn('p-4', isActive && 'bg-emerald-700', 'p-6')
 * → 'bg-emerald-700 p-6'  (p-6 wins over p-4)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
