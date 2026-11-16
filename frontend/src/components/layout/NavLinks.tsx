import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { navItems } from './navigation'

interface NavLinksProps {
  /** Called after a link is tapped, so the mobile drawer can close itself */
  onNavigate?: () => void
}

/** The list of links shared by the desktop sidebar and the mobile drawer */
export function NavLinks({ onNavigate }: NavLinksProps) {
  const { user } = useAuth()
  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {visibleItems.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              // 44px tall rows keep the links easy to hit on a phone
              'group relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* Thin bar on the active link, drawn with a transform so nothing reflows */}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-0 top-2 bottom-2 w-[3px] origin-center rounded-full bg-primary transition-transform duration-200 ease-snap',
                  isActive ? 'scale-y-100' : 'scale-y-0'
                )}
              />
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
