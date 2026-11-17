import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  description?: string
  /** Small label above the title, e.g. "Equipment" or the date */
  eyebrow?: string
  /** Buttons shown on the right (stacked below the text on phones) */
  actions?: ReactNode
  className?: string
}

/** Title block used at the top of every signed-in page, with a fading contour band behind it */
export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('relative isolate flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-2', className)}>
      <ContourBackdrop className="absolute -right-8 -top-10 -z-10 hidden h-48 w-[560px] text-fern/[0.12] [mask-image:radial-gradient(ellipse_at_55%_45%,black_5%,transparent_62%)] sm:block" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="min-w-0"
      >
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-fern">
            <span className="h-px w-5 bg-kowhai" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[32px] font-semibold leading-[1.1] md:text-[38px]">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">{description}</p>}
      </motion.div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
