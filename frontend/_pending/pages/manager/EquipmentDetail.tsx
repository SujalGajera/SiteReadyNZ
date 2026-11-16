// pages/manager/EquipmentDetail.tsx — Detail view for a single piece of equipment
// Shows all fields and inspection history for one equipment record.

import { useParams, useNavigate } from 'react-router-dom'
import { useEquipment } from '../../hooks/useEquipment'
import { StatusBadge } from '../../components/equipment/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/dateHelpers'

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { equipment, loading } = useEquipment()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  // Find the specific equipment item from the already-loaded list
  const item = equipment.find((e) => e._id === id)

  if (!item) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">Equipment not found</p>
        <Button variant="ghost" onClick={() => navigate('/equipment')} className="mt-4">
          Back to Equipment
        </Button>
      </div>
    )
  }

  // Readable label for the equipment type
  const typeLabels: Record<typeof item.type, string> = {
    fire_extinguisher: 'Fire Extinguisher',
    first_aid: 'First Aid Kit',
    aed: 'AED (Defibrillator)',
    safety_sign: 'Safety Sign',
    other: 'Other',
  }

  // A simple detail row — label above value
  function DetailRow({ label, value }: { label: string; value: string }) {
    return (
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-zinc-800">{value}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back link + header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1"
        >
          Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-800">{item.name}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{item.serialNumber}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Equipment details card */}
      <Card>
        <h2 className="text-sm font-semibold text-zinc-700 mb-4">Equipment details</h2>
        <div className="grid grid-cols-2 gap-5">
          <DetailRow label="Type" value={typeLabels[item.type]} />
          <DetailRow label="Location" value={item.location} />
          <DetailRow label="Purchase date" value={formatDate(item.purchaseDate)} />
          <DetailRow label="Expiry date" value={formatDate(item.expiryDate)} />
          <DetailRow
            label="Last inspected"
            value={item.lastInspectedAt ? formatDate(item.lastInspectedAt) : 'Not yet inspected'}
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate('/equipment')}>
          Back to list
        </Button>
      </div>
    </div>
  )
}
