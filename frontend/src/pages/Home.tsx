import { Navigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { useAuth } from '@/hooks/useAuth'

/** Time-of-day greeting, using the device clock */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Landing page for staff. Phase 4 replaces the body with their assigned inspections.
export default function HomePage() {
  const { user } = useAuth()

  // Managers work from the equipment list, so that is their home
  if (user?.role === 'manager') return <Navigate to="/equipment" replace />

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeader eyebrow="Your inspections" title={`${getGreeting()}, ${user?.name.split(' ')[0]}`} />
      <div className="relative isolate overflow-hidden rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
        <ContourBackdrop className="absolute inset-0 -z-10 h-full w-full text-fern/[0.1] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <h2 className="font-display text-2xl font-semibold">Nothing assigned yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">
          When your manager assigns you a site check it will appear here, ready to complete even without a signal.
        </p>
      </div>
    </div>
  )
}
