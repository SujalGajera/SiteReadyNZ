import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { Button } from '@/components/ui/button'

interface EquipmentEmptyStateProps {
  /** True when the list has items but the filters hide them all */
  isFiltered: boolean
  onClearFilters: () => void
  onAdd: () => void
}

/** Two cases: nothing added yet, or nothing matches the filters. Every list needs one (AGENT_RULES). */
export function EquipmentEmptyState({ isFiltered, onClearFilters, onAdd }: EquipmentEmptyStateProps) {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
      <ContourBackdrop className="absolute inset-0 -z-10 h-full w-full text-fern/[0.1] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <h2 className="font-display text-2xl font-semibold">{isFiltered ? 'Nothing matches those filters' : 'No equipment on the map yet'}</h2>
      <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">
        {isFiltered
          ? 'Try a different search, or clear the filters to see everything.'
          : 'Add your first fire extinguisher, first aid kit or AED. SiteReady works out when each one needs attention.'}
      </p>
      <Button className="mt-6" variant={isFiltered ? 'outline' : 'default'} onClick={isFiltered ? onClearFilters : onAdd}>
        {isFiltered ? 'Clear filters' : 'Add equipment'}
      </Button>
    </div>
  )
}
