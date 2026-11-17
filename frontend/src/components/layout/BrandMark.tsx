import { cn } from '@/utils/cn'

interface BrandMarkProps {
  className?: string
  /** Show only the shield (for tight spaces such as the phone header) */
  compact?: boolean
}

/**
 * The SiteReady NZ logo. Two transparent PNGs are cut from the supplied artwork:
 * the full lock-up (shield + wordmark) and the shield on its own.
 */
export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return compact ? (
    <img src="/brand/logo-mark.png" alt="SiteReady NZ" width={456} height={497} className={cn('h-9 w-auto', className)} />
  ) : (
    <img src="/brand/logo-full.png" alt="SiteReady NZ" width={1935} height={497} className={cn('h-10 w-auto', className)} />
  )
}
