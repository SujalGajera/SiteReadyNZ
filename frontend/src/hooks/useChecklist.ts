import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deleteDraft, getDraft, saveDraft, type Draft } from '@/services/offlineDb'
import type { ChecklistAnswer, ChecklistItem, Inspection, OutboxEntry } from '@/types'

type Answers = Draft['answers']

/** The problems that stop Submit from working, as one plain sentence (or null when it is ready) */
export function describeBlocker(items: ChecklistItem[], answers: Answers): string | null {
  const unanswered = items.filter((item) => !answers[item.itemId]).length
  if (unanswered > 0) return `${unanswered} ${unanswered === 1 ? 'item still needs' : 'items still need'} an answer`

  const missingNote = items.filter((item) => {
    const answer = answers[item.itemId]
    return answer.result !== 'pass' && answer.notes.trim() === ''
  }).length
  if (missingNote > 0) return `Add a note to ${missingNote === 1 ? '1 failed or flagged item' : `${missingNote} failed or flagged items`}`

  return null
}

/** Makes a random id for one finished checklist. The server uses it to recognise a repeated upload. */
function newSubmissionId(): string {
  return crypto.randomUUID()
}

/**
 * All the state behind the checklist screen: the answers, saving them as a draft on the device
 * as the person goes (so closing the app loses nothing), progress, and building the submission.
 */
export function useChecklist(inspection: Inspection | undefined, userId: string) {
  const [answers, setAnswers] = useState<Answers>({})
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  // One id for this sitting. If Submit is pressed twice, both attempts carry the same id.
  const submissionId = useRef(newSubmissionId())
  const inspectionId = inspection?._id

  // Bring back a saved draft when the screen opens
  useEffect(() => {
    if (!inspectionId) return
    let cancelled = false
    void getDraft(inspectionId, userId).then((draft) => {
      if (cancelled) return
      if (draft) setAnswers(draft.answers)
      setDraftLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [inspectionId, userId])

  // Save the draft shortly after each change
  useEffect(() => {
    if (!inspectionId || !draftLoaded || Object.keys(answers).length === 0) return
    const timer = window.setTimeout(() => {
      void saveDraft({ inspectionId, userId, updatedAt: new Date().toISOString(), answers }).then(() => setLastSavedAt(new Date()))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [answers, inspectionId, userId, draftLoaded])

  const items = useMemo(() => inspection?.items ?? [], [inspection])

  const setResult = useCallback((itemId: string, result: ChecklistAnswer) => {
    setAnswers((current) => ({ ...current, [itemId]: { result, notes: current[itemId]?.notes ?? '' } }))
  }, [])

  const setNotes = useCallback((itemId: string, notes: string) => {
    setAnswers((current) => (current[itemId] ? { ...current, [itemId]: { ...current[itemId], notes } } : current))
  }, [])

  const answeredCount = items.filter((item) => answers[item.itemId]).length
  const blocker = describeBlocker(items, answers)

  /** Builds the entry for the outbox. The caller saves it and uploads it. */
  const buildEntry = useCallback((): OutboxEntry | null => {
    if (!inspection || blocker) return null
    return {
      submissionId: submissionId.current,
      inspectionId: inspection._id,
      userId,
      equipmentName: inspection.equipmentId.name,
      completedAt: new Date().toISOString(),
      items: items.map((item) => ({ itemId: item.itemId, result: answers[item.itemId].result as ChecklistAnswer, notes: answers[item.itemId].notes.trim() })),
      state: 'waiting',
    }
  }, [inspection, blocker, userId, items, answers])

  const clearDraft = useCallback(async () => {
    if (inspectionId) await deleteDraft(inspectionId)
  }, [inspectionId])

  return { answers, setResult, setNotes, answeredCount, total: items.length, blocker, lastSavedAt, buildEntry, clearDraft, draftLoaded }
}
