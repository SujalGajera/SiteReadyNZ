import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BrandMark } from '@/components/layout/BrandMark'
import { cn } from '@/utils/cn'

// Rows shown in the preview card on the left. They echo the real checklist screen.
const previewRows = [
  { item: 'Fire extinguisher, Level 2 corridor', result: 'Pass', tone: 'ok' },
  { item: 'Emergency exit lighting', result: 'Pass', tone: 'ok' },
  { item: 'First aid kit, reception', result: 'Flag', tone: 'warn' },
  { item: 'AED battery and pads', result: 'Fail', tone: 'danger' },
] as const

const toneClasses = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
}

/** Left panel: a forest-green "site office" with a ruled-paper texture and a small product preview */
function BrandPanel() {
  return (
    <aside
      className={cn(
        'relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex',
        // faint horizontal rules, like a printed inspection sheet
        "bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,hsl(var(--primary-foreground)/0.06)_31px,hsl(var(--primary-foreground)/0.06)_32px)]"
      )}
    >
      <BrandMark tone="inverse" className="self-start" />

      <div className="max-w-md">
        <h2 className="text-[34px] font-semibold leading-[1.15] tracking-tight">
          Know what is expiring before the auditor does.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-primary-foreground/75">
          Keep every fire extinguisher, first aid kit and AED in one list, and run site checks
          from your phone. They still save when the signal drops.
        </p>

        <div className="mt-10 rounded-lg bg-card p-4 text-card-foreground shadow-md">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Weekly safety check
          </p>
          <ul className="divide-y">
            {previewRows.map(({ item, result, tone }) => (
              <li key={item} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span>{item}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider', toneClasses[tone])}>
                  {result}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-primary-foreground/60">Built for New Zealand workplaces.</p>
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
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <motion.div
          // Gentle arrival: transform and opacity only, 250ms, snappy ease
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-7 text-center text-sm text-muted-foreground">{footer}</div>
        </motion.div>
      </main>
    </div>
  )
}
