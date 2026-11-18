import { CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { InspectionCard } from '@/components/inspection/InspectionCard'
import { OutboxList } from '@/components/inspection/OutboxList'
import { useAuth } from '@/hooks/useAuth'
import { useMyInspections } from '@/hooks/useMyInspections'
import { useSync } from '@/hooks/useSync'
import { formatDate } from '@/utils/dateHelpers'

/** Staff home: the jobs they have been given. Works offline from the copy saved on the device. */
export default function StaffInspectionListPage() {
  const { user } = useAuth()
  const { inspections, isLoading, error, offlineCopySavedAt, draftCounts, reload } = useMyInspections()
  const { waiting } = useSync()

  // A job whose finished checklist is still in the outbox is "done" from the person's point of view
  const waitingIds = new Set(waiting.map((entry) => entry.inspectionId))
  const todo = inspections.filter((inspection) => inspection.status !== 'completed' && !waitingIds.has(inspection._id))
  const done = inspections.filter((inspection) => inspection.status === 'completed').slice(-5).reverse()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Inspections"
        title={`Hi ${user?.name.split(' ')[0]}`}
        description={todo.length === 0 ? 'Nothing waiting for you.' : `${todo.length} ${todo.length === 1 ? 'check' : 'checks'} to do.`}
      />

      {offlineCopySavedAt && (
        <p className="flex items-start gap-2 rounded-lg border border-kowhai/40 bg-kowhai-soft px-3.5 py-2.5 text-sm text-warn">
          <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Showing the list saved on this phone at {new Date(offlineCopySavedAt).toLocaleString('en-NZ', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. New jobs appear when you are back online.
          </span>
        </p>
      )}

      <OutboxList />

      {isLoading ? (
        <div className="space-y-2.5" role="status" aria-label="Loading your inspections">
          {[0, 1, 2].map((card) => (
            <Skeleton key={card} className="h-[84px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border bg-card px-6 py-12 text-center" role="alert">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      ) : todo.length === 0 ? (
        <div className="relative isolate overflow-hidden rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <ContourBackdrop className="absolute inset-0 -z-10 h-full w-full text-fern/[0.1] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          <h2 className="font-display text-2xl font-semibold">All caught up</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">New checks from your manager show up here, and stay available without signal.</p>
        </div>
      ) : (
        <ul className="space-y-2.5" aria-label="Checks to do">
          {todo.map((inspection) => (
            <InspectionCard key={inspection._id} inspection={inspection} draftAnswered={draftCounts[inspection._id]} />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <section aria-label="Recently completed" className="pt-2">
          <h2 className="mb-2 font-display text-lg font-semibold">Done recently</h2>
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {done.map((inspection) => (
              <li key={inspection._id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate font-medium">{inspection.equipmentId.name}</span>
                <span className="shrink-0 text-muted-foreground">{formatDate(inspection.completedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
