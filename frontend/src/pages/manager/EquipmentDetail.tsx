import { Link, useParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/equipment/StatusBadge'
import { useEquipmentDetail } from '@/hooks/useEquipmentDetail'
import { describeDaysUntil, formatDate } from '@/utils/dateHelpers'
import { equipmentTypeLabels } from '@/utils/statusCalculator'

/** One row in the details list */
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b px-5 py-3.5 last:border-b-0 sm:grid sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium sm:mt-0">{children}</dd>
    </div>
  )
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { item, isLoading, error } = useEquipmentDetail(id)

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/equipment" className="inline-block text-sm text-muted-foreground hover:text-foreground">
        &larr; All equipment
      </Link>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {error && (
        <div className="rounded-lg border bg-card px-6 py-10 text-center" role="alert">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {item && (
        <>
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">{item.name}</h1>
            <StatusBadge status={item.status} />
          </header>

          <dl className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <Detail label="Type">{equipmentTypeLabels[item.type]}</Detail>
            <Detail label="Location">{item.location}</Detail>
            <Detail label="Serial number">{item.serialNumber || '\u2013'}</Detail>
            <Detail label="Purchased">{formatDate(item.purchaseDate)}</Detail>
            <Detail label="Expires">
              <span className="tabular-nums">{formatDate(item.expiryDate)}</span>
              <span className="font-normal text-muted-foreground"> ({describeDaysUntil(item.expiryDate)})</span>
            </Detail>
            <Detail label="Last inspected">{formatDate(item.lastInspectedAt)}</Detail>
            <Detail label="Added by">{item.assignedManagerId?.name ?? '\u2013'}</Detail>
          </dl>
        </>
      )}
    </div>
  )
}
