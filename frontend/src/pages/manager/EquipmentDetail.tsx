import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/equipment/StatusBadge'
import { useEquipmentDetail } from '@/hooks/useEquipmentDetail'
import { describeDaysUntil, formatDate } from '@/utils/dateHelpers'
import { equipmentTypeLabels, statusDisplay } from '@/utils/statusCalculator'

/** One row in the facts list */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b px-5 py-4 last:border-b-0 sm:grid sm:grid-cols-[190px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-medium sm:mt-0">{children}</dd>
    </div>
  )
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { item, isLoading, error } = useEquipmentDetail(id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/equipment" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All equipment
      </Link>

      {isLoading && <Skeleton className="h-72 w-full rounded-2xl" />}

      {error && (
        <div className="rounded-2xl border bg-card px-6 py-10 text-center" role="alert">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {item && (
        <>
          <PageHeader eyebrow={equipmentTypeLabels[item.type]} title={item.name} actions={<StatusBadge status={item.status} className="px-3.5 py-1.5 text-xs" />} />
          <p className="-mt-3 text-[15px] text-muted-foreground">{statusDisplay[item.status].meaning}</p>

          <dl className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <Fact label="Location">{item.location}</Fact>
            <Fact label="Serial number">{item.serialNumber || '\u2013'}</Fact>
            <Fact label="Purchased">{formatDate(item.purchaseDate)}</Fact>
            <Fact label="Expires">
              <span className="tabular-nums">{formatDate(item.expiryDate)}</span>
              <span className="font-normal text-muted-foreground"> ({describeDaysUntil(item.expiryDate)})</span>
            </Fact>
            <Fact label="Last inspected">{formatDate(item.lastInspectedAt)}</Fact>
            <Fact label="Added by">{item.assignedManagerId?.name ?? '\u2013'}</Fact>
          </dl>
        </>
      )}
    </div>
  )
}
