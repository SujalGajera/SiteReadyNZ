// pages/manager/Reports.tsx — Summary reports page for managers
// Shows a quick overview of inspections by status. Read-only — no actions.

import { useInspections } from '../../hooks/useInspections'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'

export default function ReportsPage() {
  const { inspections, loading, error } = useInspections()

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

  // Count inspections by status
  const total = inspections.length
  const completed = inspections.filter((i) => i.status === 'completed').length
  const pending = inspections.filter((i) => i.status === 'pending').length
  const inProgress = inspections.filter((i) => i.status === 'in_progress').length
  const overdue = inspections.filter((i) => i.status === 'overdue').length

  const stats = [
    { label: 'Total inspections', value: total, colour: 'text-zinc-800' },
    { label: 'Completed', value: completed, colour: 'text-green-700' },
    { label: 'In progress', value: inProgress, colour: 'text-blue-700' },
    { label: 'Pending', value: pending, colour: 'text-zinc-500' },
    { label: 'Overdue', value: overdue, colour: 'text-red-600' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-800">Reports</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Inspection summary across all equipment at your site.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold ${stat.colour}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent inspections table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-700">Recent inspections</h2>
        </div>

        {inspections.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-10">
            No inspections recorded yet.
          </p>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Equipment</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Assigned to</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Due date</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</span>
            </div>

            {/* Rows — show newest 20 */}
            {inspections.slice(0, 20).map((inspection) => (
              <div
                key={inspection._id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 items-center px-5 py-3 border-b border-zinc-100 last:border-0"
              >
                <span className="text-sm text-zinc-800">
                  {inspection.equipmentName ?? inspection.equipmentId}
                </span>
                <span className="text-sm text-zinc-600">
                  {inspection.staffName ?? inspection.assignedStaffId}
                </span>
                <span className="text-sm text-zinc-600">
                  {new Date(inspection.scheduledDate).toLocaleDateString('en-NZ')}
                </span>
                <span
                  className={`text-sm font-medium capitalize ${
                    inspection.status === 'completed'
                      ? 'text-green-700'
                      : inspection.status === 'overdue'
                      ? 'text-red-600'
                      : inspection.status === 'in_progress'
                      ? 'text-blue-700'
                      : 'text-zinc-500'
                  }`}
                >
                  {inspection.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  )
}
