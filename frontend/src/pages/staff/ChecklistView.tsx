import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChecklistGroup } from '@/components/inspection/ChecklistGroup'
import { SubmitPanel } from '@/components/inspection/SubmitPanel'
import { describeDue } from '@/components/inspection/InspectionCard'
import { useAuth } from '@/hooks/useAuth'
import { useChecklist } from '@/hooks/useChecklist'
import { useMyInspections } from '@/hooks/useMyInspections'
import { useSync } from '@/hooks/useSync'
import type { ChecklistItem } from '@/types'

/** Groups questions under their category heading, keeping the order they were written in */
function groupByCategory(items: ChecklistItem[]): { title: string; items: ChecklistItem[] }[] {
  const groups = new Map<string, ChecklistItem[]>()
  for (const item of items) groups.set(item.category, [...(groups.get(item.category) ?? []), item])
  return Array.from(groups, ([title, groupItems]) => ({ title, items: groupItems }))
}

/** The checklist a staff member fills in. Everything here works with no signal. */
export default function ChecklistViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { inspections, isLoading } = useMyInspections()
  const { submit, waiting } = useSync()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inspection = inspections.find((candidate) => candidate._id === id)
  const checklist = useChecklist(inspection, user?.id ?? '')
  const isWaitingToUpload = waiting.some((entry) => entry.inspectionId === id)

  async function handleSubmit() {
    const entry = checklist.buildEntry()
    if (!entry) return
    setIsSubmitting(true)
    try {
      const outcome = await submit(entry)
      await checklist.clearDraft()
      if (outcome === 'uploaded') {
        toast.success('Inspection submitted', { description: `${entry.equipmentName} is checked.` })
      } else {
        toast.success('Saved on this phone', { description: 'It will upload by itself when you have signal.' })
      }
      navigate('/inspections', { replace: true })
    } catch {
      toast.error('Could not save your answers', { description: 'Your draft is still here. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const backLink = (
    <Link to="/inspections" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden="true" />
      All inspections
    </Link>
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        {backLink}
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {backLink}
        <div className="rounded-2xl border bg-card px-6 py-12 text-center">
          <h1 className="font-display text-2xl font-semibold">We could not find that inspection</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may have been completed, or it was not saved on this phone while you had signal.</p>
        </div>
      </div>
    )
  }

  const due = describeDue(inspection.scheduledDate)

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-44 lg:pb-0">
      {backLink}
      <PageHeader eyebrow={due.text} title={inspection.equipmentId.name} description={inspection.equipmentId.location} />

      {isWaitingToUpload || inspection.status === 'completed' ? (
        <div className="rounded-2xl border bg-card px-6 py-12 text-center">
          <h2 className="font-display text-2xl font-semibold">{isWaitingToUpload ? 'Finished, waiting to upload' : 'This check is complete'}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {isWaitingToUpload ? 'Your answers are safe on this phone and upload when you have signal.' : 'Thank you. Nothing more to do here.'}
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {groupByCategory(inspection.items).map((group) => (
              <ChecklistGroup key={group.title} title={group.title} items={group.items} answers={checklist.answers} onResult={checklist.setResult} onNotes={checklist.setNotes} />
            ))}
          </div>
          <div className="lg:sticky lg:top-6">
            <SubmitPanel
              inspection={inspection}
              answered={checklist.answeredCount}
              total={checklist.total}
              blocker={checklist.blocker}
              lastSavedAt={checklist.lastSavedAt}
              isSubmitting={isSubmitting}
              onSubmit={() => void handleSubmit()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
