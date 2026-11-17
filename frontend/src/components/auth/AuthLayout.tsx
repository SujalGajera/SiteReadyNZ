import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { BrandMark } from '@/components/layout/BrandMark'
import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { ReadinessRing } from '@/components/brand/ReadinessRing'

// A small, made-up snapshot to show what the product gives you
const previewRows = [
  { label: 'Ready', count: 11, bar: 'bg-ok', width: 'w-[78%]' },
  { label: 'Due soon', count: 2, bar: 'bg-kowhai', width: 'w-[16%]' },
  { label: 'Needs action', count: 1, bar: 'bg-overdue', width: 'w-[8%]' },
]

/** Left panel: deep green with contour lines that draw themselves in, the logo on a paper tag, and a readiness snapshot */
function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
      <ContourBackdrop animate className="absolute inset-0 h-full w-full text-kowhai/30" />
      {/* Darkens the lower-left so the text stays easy to read over the lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,hsl(var(--primary))_25%,transparent_75%)]" aria-hidden="true" />

      {/* The logo sits on a paper "site sign", tilted a degree like a label stuck on by hand */}
      <motion.div
        initial={{ opacity: 0, y: -10, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -1.2 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative inline-flex self-start rounded-xl bg-card px-5 py-3.5 shadow-lg"
      >
        <BrandMark className="h-11" />
      </motion.div>

      <div className="relative max-w-lg">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[44px] font-semibold leading-[1.05]"
        >
          Know what is expiring before the auditor does.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 max-w-md text-base leading-relaxed text-primary-foreground/75"
        >
          Every extinguisher, first aid kit and AED in one list. Site checks you can finish on a phone, even when the signal drops.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center gap-6 rounded-2xl bg-card p-5 text-card-foreground shadow-xl"
      >
        <ReadinessRing value={86} size={104} strokeWidth={10} arcClassName="text-ok" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold">Site readiness</p>
          <p className="mb-3 text-xs text-muted-foreground">Example workplace, 14 items</p>
          <ul className="space-y-1.5">
            {previewRows.map((row) => (
              <li key={row.label} className="flex items-center gap-2 text-xs">
                <span className="w-[84px] text-muted-foreground">{row.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span className={`block h-full rounded-full ${row.bar} ${row.width}`} />
                </span>
                <span className="w-4 text-right font-semibold tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </aside>
  )
}

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  /** Link row under the form, e.g. "No account? Create one" */
  footer: ReactNode
}

/** Shared frame for the sign-in and register pages */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <BrandPanel />
      <main className="relative flex items-center justify-center overflow-hidden bg-card px-5 py-10 sm:px-8 lg:bg-canvas">
        {/* On phones the contour lines sit softly behind the form instead of the green panel */}
        <ContourBackdrop className="absolute inset-0 h-full w-full text-fern/[0.07] lg:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[400px]"
        >
          <div className="mb-9 lg:hidden">
            <BrandMark className="h-10" />
          </div>
          <h1 className="font-display text-[34px] font-semibold leading-tight">{title}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        </motion.div>
      </main>
    </div>
  )
}
