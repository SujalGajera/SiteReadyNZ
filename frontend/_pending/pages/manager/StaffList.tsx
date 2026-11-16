// pages/manager/StaffList.tsx — Simple read-only staff list for the manager
// Shows all staff users registered in the system.

import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'

// The shape of a staff user returned by the API
interface StaffUser {
  _id: string
  name: string
  email: string
  role: string
}

export default function StaffListPage() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch all staff users from the backend
    api
      .get<StaffUser[]>('/api/users?role=staff')
      .then((res) => setStaff(res.data))
      .catch(() => setError('Could not load staff list. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

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
        <h1 className="text-2xl font-semibold text-zinc-800">Staff</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Staff members who can complete inspection checklists.
        </p>
      </div>

      {staff.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500 text-center py-6">
            No staff members registered yet. Ask your team to create accounts.
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[2fr_2fr] gap-4 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</span>
          </div>
          {staff.map((member) => (
            <div
              key={member._id}
              className="grid grid-cols-[2fr_2fr] gap-4 items-center px-4 py-3 border-b border-zinc-100 last:border-0"
            >
              <span className="text-sm font-medium text-zinc-800">{member.name}</span>
              <span className="text-sm text-zinc-600">{member.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
