import { BrandMark } from './BrandMark'
import { NavLinks } from './NavLinks'
import { useAuth } from '@/hooks/useAuth'

/** Desktop sidebar (hidden below the md breakpoint, where the drawer takes over) */
export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card/60 md:flex">
      <div className="flex h-16 items-center px-5">
        <BrandMark />
      </div>

      <p className="px-5 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Workspace
      </p>
      <div className="flex-1 px-3">
        <NavLinks />
      </div>

      {/* Whose workspace this is, mirroring the wireframe's bottom-left card */}
      <div className="m-3 rounded-lg border bg-background px-3 py-2.5">
        <p className="text-[13px] font-semibold capitalize">{user?.role} workspace</p>
        <p className="text-xs text-muted-foreground">Facility safety and compliance</p>
      </div>
    </aside>
  )
}
