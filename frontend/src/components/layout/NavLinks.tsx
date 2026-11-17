import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { navItems } from './navigation'

interface NavLinksProps {
  /** Called after a link is tapped, so the mobile drawer can close itself */
  onNavigate?: () => void
  /** Keeps the sliding highlight of the sidebar and of the drawer from sharing one animation */
  group: string
}

/** The list of links shared by the desktop sidebar and the mobile drawer */
export function NavLinks({ onNavigate, group }: NavLinksProps) {
  const { user } = useAuth()
  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {visibleItems.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          // 44px tall rows keep the links easy to hit on a phone
          className={({ isActive }) =>
            cn(
              'relative flex h-11 items-center gap-3 rounded-lg px-3.5 text-[15px] font-medium transition-colors duration-150',
              isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* The dark pill glides from the old link to the new one (shared layout animation) */}
              {isActive && (
                <motion.span
                  layoutId={`nav-pill-${group}`}
                  className="absolute inset-0 -z-0 rounded-lg bg-primary"
                  transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                />
              )}
              <Icon className="relative size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              <span className="relative">{label}</span>
              {isActive && <span className="relative ml-auto size-1.5 rounded-full bg-kowhai" aria-hidden="true" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
