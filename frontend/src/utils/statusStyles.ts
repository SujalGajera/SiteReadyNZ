import type { EquipmentStatus } from '@/types'

/**
 * Tailwind classes for each status, in one place so the badge, the row edge, the progress bar
 * and the readiness legend always agree. (Full class names are written out so Tailwind can find them.)
 */
export const statusStyles: Record<EquipmentStatus, { badge: string; edge: string; bar: string; dot: string; text: string; fill: string }> = {
  ok: {
    badge: 'bg-ok-soft text-ok',
    edge: 'bg-ok',
    bar: 'bg-ok',
    dot: 'bg-ok',
    text: 'text-ok',
    fill: 'fill-ok',
  },
  due_soon: {
    badge: 'bg-warn-soft text-warn',
    edge: 'bg-kowhai',
    bar: 'bg-kowhai',
    dot: 'bg-kowhai',
    text: 'text-warn',
    fill: 'fill-kowhai',
  },
  overdue: {
    badge: 'bg-overdue-soft text-overdue',
    edge: 'bg-overdue',
    bar: 'bg-overdue',
    dot: 'bg-overdue',
    text: 'text-overdue',
    fill: 'fill-overdue',
  },
  // Expired is the most serious state, so its badge is the only solid-filled one
  expired: {
    badge: 'bg-danger text-destructive-foreground',
    edge: 'bg-danger',
    bar: 'bg-danger',
    dot: 'bg-danger',
    text: 'text-danger',
    fill: 'fill-danger',
  },
}
