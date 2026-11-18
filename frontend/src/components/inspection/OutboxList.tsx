import { Button } from '@/components/ui/button'
import { useOffline } from '@/context/OfflineContext'
import { useSync } from '@/hooks/useSync'

/**
 * Finished checklists that have not reached the server yet, and ones the server refused.
 * This is where a person can see that their offline work is safe (the rubric's "sync feedback").
 */
export function OutboxList() {
  const { waiting, failed, isUploading, uploadNow, discard } = useSync()
  const { isOnline } = useOffline()

  if (waiting.length === 0 && failed.length === 0) return null

  return (
    <section aria-label="Waiting to upload" className="space-y-2.5">
      {waiting.length > 0 && (
        <div className="rounded-xl border border-kowhai/50 bg-kowhai-soft/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">
                {waiting.length} {waiting.length === 1 ? 'inspection' : 'inspections'} waiting to upload
              </h2>
              <p className="text-sm text-muted-foreground">
                {isOnline ? 'Sending now.' : 'Saved on this phone. They upload by themselves when you have signal.'}
              </p>
            </div>
            {isOnline && (
              <Button variant="outline" size="sm" className="h-11 bg-card" loading={isUploading} onClick={() => void uploadNow()}>
                Try now
              </Button>
            )}
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {waiting.map((entry) => (
              <li key={entry.submissionId} className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2.5">
                <span className="truncate font-medium">{entry.equipmentName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  finished {new Date(entry.completedAt).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {failed.map((entry) => (
        <div key={entry.submissionId} className="rounded-xl border border-danger/30 bg-danger-soft p-4" role="alert">
          <h2 className="font-display text-lg font-semibold text-danger">{entry.equipmentName} was not accepted</h2>
          <p className="mt-0.5 text-sm text-danger">{entry.error}</p>
          <Button variant="outline" size="sm" className="mt-3 h-11 bg-card" onClick={() => void discard(entry.submissionId)}>
            Dismiss
          </Button>
        </div>
      ))}
    </section>
  )
}
