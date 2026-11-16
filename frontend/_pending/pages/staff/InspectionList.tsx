// pages/staff/InspectionList.tsx — Staff view: list of assigned inspections
// Staff see only their own assigned inspections. Each row links to the checklist.

import { useNavigate } from 'react-router-dom'
import { useInspections } from '../../hooks/useInspections'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/dateHelpers'
import type { Inspection } from '../../types'

// Map inspection status to badge variant
function statusToBadgeVariant(status: Inspection['status']) {
  const map: Record<Inspection['status'], 'completed' | 'in_progress' | 'pending' | 'overdue'> = {
    completed: 'completed',
    in_progress: 'in_progress',
    pending: 'pending',
    overdue: 'overdue',
  }
  return map[status]
}

export default function InspectionListPage() {
  const { inspections, loading, error } = useInspections()
  const navigate = useNavigate()

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-800">My Inspections</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Inspection checklists assigned to you. Tap a row to open the checklist.
        </p>
      </div>

      {inspections.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 px-6 py-16 text-center">
          <p className="text-sm font-medium text-zinc-700">No inspections assigned</p>
          <p className="text-sm text-zinc-500 mt-1">
            Your manager will assign inspections when they are due.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Equipment</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Location</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Due date</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide"></span>
          </div>

          {inspections.map((inspection) => (
            <div
              key={inspection._id}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/inspections/${inspection._id}`)}
            >
              <span className="text-sm font-medium text-zinc-800">
                {inspection.equipmentName ?? 'Equipment'}
              </span>
              <span className="text-sm text-zinc-600">{inspection.location ?? '—'}</span>
              <span className="text-sm text-zinc-600">{formatDate(inspection.scheduledDate)}</span>
              <Badge variant={statusToBadgeVariant(inspection.status)}>
                {inspection.status.replace('_', ' ')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  // Stop the row click from also firing
                  e.stopPropagation()
                  navigate(`/inspections/${inspection._id}`)
                }}
              >
                Open
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
