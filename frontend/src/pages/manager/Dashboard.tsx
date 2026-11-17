import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEquipmentDashboard } from '@/hooks/useEquipmentDashboard'
import { StatsCards } from '@/components/equipment/StatsCards'
import { EquipmentToolbar } from '@/components/equipment/EquipmentToolbar'
import { EquipmentTable } from '@/components/equipment/EquipmentTable'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { EquipmentEmptyState } from '@/components/equipment/EquipmentEmptyState'
import { EquipmentFormSheet } from '@/components/equipment/EquipmentFormSheet'
import { DeleteEquipmentDialog } from '@/components/equipment/DeleteEquipmentDialog'

/** Manager's main screen: stats, search and filter, and the equipment list */
export default function EquipmentDashboardPage() {
  const dashboard = useEquipmentDashboard()
  const { visibleEquipment, isLoading, loadError, equipment } = dashboard

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Equipment</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everything on site, soonest expiry first.</p>
        </div>
        <Button onClick={dashboard.openAddForm}>
          <Plus aria-hidden="true" />
          Add equipment
        </Button>
      </header>

      <StatsCards counts={dashboard.counts} activeFilter={dashboard.statusFilter} onSelect={dashboard.setStatusFilter} />

      <EquipmentToolbar
        search={dashboard.search}
        onSearchChange={dashboard.setSearch}
        statusFilter={dashboard.statusFilter}
        onStatusFilterChange={dashboard.setStatusFilter}
      />

      <section aria-label="Equipment list" className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4" role="status" aria-label="Loading equipment">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        ) : loadError ? (
          <div className="px-6 py-12 text-center">
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
          <>
            <div className="hidden md:block">
              <EquipmentTable
                items={visibleEquipment}
                sortKey={dashboard.sortKey}
                sortDirection={dashboard.sortDirection}
                onSort={dashboard.toggleSort}
                onEdit={dashboard.openEditForm}
                onDelete={dashboard.requestDelete}
              />
            </div>
            <ul className="space-y-3 bg-background p-3 md:hidden">
              {visibleEquipment.map((item) => (
                <EquipmentCard key={item._id} item={item} onEdit={dashboard.openEditForm} onDelete={dashboard.requestDelete} />
              ))}
            </ul>
          </>
        )}
      </section>

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
