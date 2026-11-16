// components/equipment/StatsCards.tsx
// Four summary cards shown at the top of the Equipment Dashboard.
// Each card shows a single count so the manager can see the situation at a glance.

import type { Equipment } from '../../types'

interface StatsCardsProps {
  equipment: Equipment[]
}

export function StatsCards({ equipment }: StatsCardsProps) {
  // Count each status category from the equipment list
  const total = equipment.length
  const ok = equipment.filter((e) => e.status === 'ok').length
  const dueSoon = equipment.filter((e) => e.status === 'due_soon').length
  const overdue = equipment.filter((e) => e.status === 'overdue').length
  const expired = equipment.filter((e) => e.status === 'expired').length

  // Cards definition — label, value, and colour scheme
  const cards = [
    {
      label: 'Total Equipment',
      value: total,
      // Neutral — just informational
      valueClass: 'text-zinc-800',
      borderClass: 'border-zinc-200',
    },
    {
      label: 'All Good',
      value: ok,
      valueClass: 'text-green-700',
      borderClass: 'border-green-200',
    },
    {
      label: 'Due Soon',
      value: dueSoon,
      valueClass: 'text-amber-600',
      borderClass: 'border-amber-200',
    },
    {
      label: 'Overdue / Expired',
      // Combine overdue and expired into one urgent number
      value: overdue + expired,
      valueClass: 'text-red-600',
      borderClass: 'border-red-200',
    },
  ]

  return (
    // Four equal columns that collapse to two on small screens
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-lg border ${card.borderClass} p-5`}
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
            {card.label}
          </p>
          <p className={`text-3xl font-bold ${card.valueClass}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
