import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { StaffFormSheet } from '@/components/staff/StaffFormSheet'
import { useStaff } from '@/hooks/useStaff'
import { getInitials } from '@/utils/formatters'

/** Manager's team page: who can sign in as staff, and a way to add more people */
export default function StaffListPage() {
  const { staff, isLoading, loadError, reload, addStaff, isFormOpen, openForm, closeForm } = useStaff()

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        eyebrow="Staff"
        title="Your team"
        description="Staff see the inspections assigned to them. Only managers can change equipment."
        actions={
          <Button onClick={openForm}>
            <Plus aria-hidden="true" />
            Add staff member
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Loading staff">
          {[0, 1, 2, 3].map((card) => (
            <Skeleton key={card} className="h-[84px] rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border bg-card px-6 py-12 text-center" role="alert">
          <p className="text-sm text-danger">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      ) : staff.length === 0 ? (
        <div className="relative isolate overflow-hidden rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <ContourBackdrop className="absolute inset-0 -z-10 h-full w-full text-fern/[0.1] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          <h2 className="font-display text-2xl font-semibold">Just you so far</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">
            Add the people who carry out inspections. Each gets their own login and sees only their own checklists.
          </p>
          <Button className="mt-6" onClick={openForm}>
            Add staff member
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Staff">
          <AnimatePresence initial={false}>
            {staff.map((person) => (
              <motion.li
                key={person.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent font-display text-base font-semibold text-accent-foreground" aria-hidden="true">
                  {getInitials(person.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{person.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{person.email}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <StaffFormSheet isOpen={isFormOpen} onSave={addStaff} onClose={closeForm} />
    </div>
  )
}
