// pages/staff/ChecklistView.tsx — The main inspection checklist page for staff
// Matches the wireframe: breadcrumb, offline banner, checklist items left,
// inspection details sidebar right, sticky submit bar at bottom.

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInspections } from '../../hooks/useInspections'
import { useOffline } from '../../context/OfflineContext'
import { ChecklistForm } from '../../components/inspection/ChecklistForm'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/dateHelpers'
import { saveOfflineSubmission } from '../../services/indexedDB'
import type { ChecklistItem, Inspection } from '../../types'

export default function ChecklistViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { inspections, loading, error, submitInspection } = useInspections()
  const { isOnline } = useOffline()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const inspection = inspections.find((i) => i._id === id)

  // Calculate completion progress from the checklist items
  function getProgress(items: ChecklistItem[]): number {
    if (items.length === 0) return 0
    const checked = items.filter((item) => item.result !== 'not_checked').length
    return Math.round((checked / items.length) * 100)
  }

  // Map inspection status to badge variant
  function getStatusBadge(status: Inspection['status']) {
    const map: Record<string, string> = {
      pending: 'pending',
      in_progress: 'in_progress',
      completed: 'completed',
      overdue: 'overdue',
    }
    return map[status] as 'pending' | 'in_progress' | 'completed' | 'overdue'
  }

  async function handleSubmit(items: ChecklistItem[]) {
    if (!inspection) return
    setSubmitting(true)

    try {
      if (isOnline) {
        // Online — submit directly to the server
        await submitInspection(inspection._id, items)
      } else {
        // Offline — save to IndexedDB outbox; will sync when connection returns
        await saveOfflineSubmission({
          ...inspection,
          items,
          syncStatus: 'pending_sync',
          status: 'completed',
          completedAt: new Date().toISOString(),
        })
      }
      setSubmitted(true)
    } catch (err) {
      console.error('Submit failed:', err)
      // Even if the server call fails, save locally as a fallback
      await saveOfflineSubmission({
        ...inspection,
        items,
        syncStatus: 'pending_sync',
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  function handleSaveDraft(items: ChecklistItem[]) {
    if (!inspection) return
    // Save draft to IndexedDB without marking as completed
    saveOfflineSubmission({
      ...inspection,
      items,
      syncStatus: 'pending_sync',
    }).catch(console.error)
  }

  // --- Loading / error / not found states ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
        {error}
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">Inspection not found</p>
        <button
          onClick={() => navigate('/inspections')}
          className="text-sm text-emerald-700 hover:underline mt-3 block mx-auto"
        >
          Back to inspections
        </button>
      </div>
    )
  }

  // Submitted confirmation screen
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12l5 5 9-9"
              stroke="#065f46"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">Inspection submitted</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {isOnline
              ? 'Your results have been sent to the server.'
              : 'Saved on this device. Will sync when you reconnect.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/inspections')}
          className="text-sm text-emerald-700 hover:underline"
        >
          Back to my inspections
        </button>
      </div>
    )
  }

  const progress = getProgress(inspection.items)

  return (
    // Two-column layout: checklist on left, details sidebar on right (matches wireframe)
    <div className="flex gap-6 items-start">

      {/* Left column — checklist */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        {/* Page title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-800">
              {/* Use equipment name if populated, fall back to a generic title */}
              {inspection.equipmentName ?? 'Weekly Safety Check'}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Inspection Checklist — #{inspection._id.slice(-4).toUpperCase()}
            </p>
          </div>
          <Badge variant={getStatusBadge(inspection.status)}>
            {inspection.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Checklist description */}
        <div>
          <h2 className="text-base font-semibold text-zinc-800 mb-0.5">Inspection items</h2>
          <p className="text-sm text-zinc-500">
            Record a result for each safety check. Add evidence for failed items.
          </p>
        </div>

        {/* The actual checklist */}
        <ChecklistForm
          inspection={inspection}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>

      {/* Right column — details sidebar */}
      <div className="w-64 shrink-0 hidden lg:flex flex-col gap-0">
        <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">

          {/* Sidebar heading */}
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Inspection details
            </p>
          </div>

          {/* Detail rows */}
          <div className="px-4 py-4 flex flex-col gap-4">
            {/* Location */}
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Location</p>
              <p className="text-sm font-medium text-zinc-800">
                {inspection.location ?? '—'}
              </p>
            </div>

            {/* Due date */}
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Due Date</p>
              <p className="text-sm font-medium text-zinc-800">
                {formatDate(inspection.scheduledDate)}
              </p>
            </div>

            {/* Assigned to */}
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Assigned To</p>
              <p className="text-sm font-medium text-zinc-800">
                {inspection.staffName ?? 'You'}
              </p>
            </div>

            {/* Equipment */}
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Equipment</p>
              <p className="text-sm font-medium text-zinc-800">
                {inspection.equipmentName ?? '—'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-zinc-500">Completion Progress</p>
                <p className="text-sm font-bold text-zinc-800">{progress}%</p>
              </div>
              <ProgressBar value={progress} />
              <p className="text-xs text-zinc-500 mt-2">
                {inspection.items.filter((i) => i.result !== 'not_checked').length} of{' '}
                {inspection.items.length} items completed
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {inspection.status === 'completed'
                  ? 'Inspection complete'
                  : 'Inspection in progress'}
              </p>
            </div>

            {/* Offline message */}
            {!isOnline && (
              <div className="pt-2 border-t border-zinc-100">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  You are currently offline. Items are saved to your browser automatically. They will
                  sync to the server when you reconnect.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
