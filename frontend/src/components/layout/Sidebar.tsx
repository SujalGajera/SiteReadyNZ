import { Link } from 'react-router-dom'
import { ContourBackdrop } from '@/components/brand/ContourBackdrop'
import { BrandMark } from './BrandMark'
import { NavLinks } from './NavLinks'
import { NotificationCard } from './NotificationCard'
import { UserCard } from './UserCard'

/** Desktop sidebar (hidden below the md breakpoint, where the top bar and drawer take over) */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col overflow-hidden border-r bg-card md:flex">
      {/* Faint contour lines rising from the bottom, a nod to the mountains in the logo */}
      <ContourBackdrop className="absolute inset-x-0 bottom-0 h-3/5 w-full text-fern/[0.09] [mask-image:linear-gradient(to_top,black,transparent)]" />

      <Link to="/" className="relative px-5 pb-4 pt-6" aria-label="SiteReady NZ home">
        <BrandMark />
      </Link>

      <div className="relative flex-1 px-3 pt-4">
        <NavLinks group="sidebar" />
      </div>

      <div className="relative space-y-2.5 p-3">
        <NotificationCard />
        <UserCard />
      </div>
    </aside>
  )
}
