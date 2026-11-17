import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/utils/formatters'
import { MobileNav } from './MobileNav'
import { BrandMark } from './BrandMark'

/**
 * Phone-only header. On larger screens the sidebar carries the logo and navigation,
 * so this bar is hidden to leave the whole height for the page.
 */
export function Topbar() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b bg-card/90 px-2 backdrop-blur md:hidden">
      <MobileNav />
      <Link to="/" aria-label="SiteReady NZ home" className="flex items-center">
        <BrandMark compact className="h-8" />
      </Link>
      <span
        className="ml-auto mr-2 flex size-9 items-center justify-center rounded-full bg-primary font-display text-xs font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        {getInitials(user?.name)}
      </span>
    </header>
  )
}
