import React from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
}

/** Simple white card container — used throughout the app for content grouping */
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-zinc-200 shadow-sm p-6',
        className
      )}
    >
      {children}
    </div>
  )
}
