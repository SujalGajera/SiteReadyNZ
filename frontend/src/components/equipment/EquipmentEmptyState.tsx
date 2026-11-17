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
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {/* A simple clipboard drawn with strokes in the brand colour */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="text-primary">
        <rect x="14" y="10" width="36" height="46" rx="5" className="fill-accent stroke-current" strokeWidth="2" />
        <rect x="23" y="5" width="18" height="9" rx="3" className="fill-background stroke-current" strokeWidth="2" />
        <path d="M22 28h20M22 36h20M22 44h11" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <h2 className="mt-4 text-base font-semibold">{isFiltered ? 'Nothing matches those filters' : 'No equipment yet'}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {isFiltered
          ? 'Try a different search, or clear the filters to see everything.'
          : 'Add your first fire extinguisher, first aid kit or AED and SiteReady will track when it needs attention.'}
      </p>
      <Button className="mt-5" variant={isFiltered ? 'outline' : 'default'} onClick={isFiltered ? onClearFilters : onAdd}>
        {isFiltered ? 'Clear filters' : 'Add equipment'}
      </Button>
    </div>
  )
}
