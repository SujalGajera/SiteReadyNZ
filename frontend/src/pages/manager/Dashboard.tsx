import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { useEquipmentDashboard } from '@/hooks/useEquipmentDashboard'
import { ReadinessHero } from '@/components/equipment/ReadinessHero'
import { EquipmentToolbar } from '@/components/equipment/EquipmentToolbar'
import { EquipmentList } from '@/components/equipment/EquipmentList'
import { EquipmentEmptyState } from '@/components/equipment/EquipmentEmptyState'
import { EquipmentFormSheet } from '@/components/equipment/EquipmentFormSheet'
import { DeleteEquipmentDialog } from '@/components/equipment/DeleteEquipmentDialog'

/** Manager's main screen: how ready the site is, then every item with search, filter and sort */
export default function EquipmentDashboardPage() {
  const dashboard = useEquipmentDashboard()
  const { visibleEquipment, isLoading, loadError, equipment } = dashboard

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        eyebrow="Equipment"
        title="What needs attention"
        description="Every item on site, checked against its expiry date and its routine inspection."
        actions={
          <Button onClick={dashboard.openAddForm}>
            <Plus aria-hidden="true" />
            Add equipment
          </Button>
        }
      />

      <ReadinessHero counts={dashboard.counts} activeFilter={dashboard.statusFilter} onSelect={dashboard.setStatusFilter} />

      <div className="space-y-4">
        <EquipmentToolbar
          search={dashboard.search}
          onSearchChange={dashboard.setSearch}
          statusFilter={dashboard.statusFilter}
          onStatusFilterChange={dashboard.setStatusFilter}
          sortOption={dashboard.sortOption}
          onSortOptionChange={dashboard.setSortOption}
        />

        {isLoading ? (
          <div className="space-y-2.5" role="status" aria-label="Loading equipment">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-[76px] w-full rounded-xl" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border bg-card px-6 py-12 text-center" role="alert">
            <p className="text-sm text-danger">{loadError}</p>
            <Button variant="outline" className="mt-4" onClick={() => void dashboard.reload()}>
              Try again
            </Button>
          </div>
        ) : visibleEquipment.length === 0 ? (
          <EquipmentEmptyState
            isFiltered={equipment.length > 0 && dashboard.hasActiveFilters}
            onClearFilters={dashboard.clearFilters}
            onAdd={dashboard.openAddForm}
          />
        ) : (
          <EquipmentList items={visibleEquipment} onEdit={dashboard.openEditForm} onDelete={dashboard.requestDelete} />
        )}
      </div>

      <EquipmentFormSheet
        isOpen={dashboard.isSheetOpen}
        item={dashboard.editingItem}
        onSave={dashboard.saveEquipment}
        onClose={dashboard.closeForm}
      />
      <DeleteEquipmentDialog
        item={dashboard.itemToDelete}
        isDeleting={dashboard.isDeleting}
        onConfirm={() => void dashboard.confirmDelete()}
        onCancel={dashboard.cancelDelete}
      />
    </div>
  )
}
