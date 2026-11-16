import { cn } from '@/utils/cn'

interface BrandMarkProps {
  className?: string
  /** Hide the wordmark and show only the tick badge (used in tight spaces) */
  compact?: boolean
  /** "inverse" is the light version for use on the dark green panel */
  tone?: 'default' | 'inverse'
}

/**
 * SiteReady logo: a forest-green badge with a tick, plus the wordmark.
 * Drawn inline as SVG so it is crisp at any size and works offline with no image request.
 */
export function BrandMark({ className, compact = false, tone = 'default' }: BrandMarkProps) {
  const isInverse = tone === 'inverse'

  return (
    <div className={cn('flex items-center gap-2.5', isInverse && 'text-primary-foreground', className)}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <rect width="26" height="26" y="2" rx="7" className={isInverse ? 'fill-primary-foreground' : 'fill-primary'} />
        <path
          d="M7.5 16.5l4.6 4.6L25 6.5"
          className={isInverse ? 'stroke-primary' : 'stroke-primary-foreground'}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span className="text-[15px] font-semibold leading-none tracking-tight">
          SiteReady
          <span
            className={cn(
              'ml-1 rounded-sm border px-1 py-px align-[1px] text-[10px] font-semibold tracking-wider',
              isInverse ? 'border-primary-foreground/40 text-primary-foreground/80' : 'border-foreground/30 text-muted-foreground'
            )}
          >
            NZ
          </span>
        </span>
      )}
    </div>
  )
}
