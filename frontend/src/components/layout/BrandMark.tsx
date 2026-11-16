import { cn } from '@/utils/cn'

interface BrandMarkProps {
  className?: string
  /** Hide the wordmark and show only the tick badge (used in tight spaces) */
  compact?: boolean
}

/**
 * SiteReady logo: a forest-green badge with a hand-drawn style tick whose
 * tail runs slightly outside the badge, plus the wordmark. Drawn inline as SVG
 * so it is crisp at any size and works offline with no image request.
 */
export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <rect width="26" height="26" y="2" rx="7" className="fill-primary" />
        <path
          d="M7.5 16.5l4.6 4.6L25 6.5"
          className="stroke-primary-foreground"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span className="text-[15px] font-semibold leading-none tracking-tight">
          SiteReady
          <span className="ml-1 rounded-sm border border-foreground/30 px-1 py-px align-[1px] text-[10px] font-semibold tracking-wider text-muted-foreground">
            NZ
          </span>
        </span>
      )}
    </div>
  )
}
