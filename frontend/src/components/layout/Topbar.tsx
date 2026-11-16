import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileNav } from './MobileNav'
import { BrandMark } from './BrandMark'
import { routeLabels } from './navigation'

/** Turns "/equipment/42" into [{label:"Equipment", to:"/equipment"}, {label:"42", ...}] */
function buildBreadcrumb(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.map((segment, index) => ({
    label: routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
    to: '/' + segments.slice(0, index + 1).join('/'),
  }))
  return crumbs.length > 0 ? crumbs : [{ label: routeLabels[''], to: '/' }]
}

export function Topbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const crumbs = buildBreadcrumb(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur md:h-16 md:px-8">
      <MobileNav />
      {/* The logo only shows on phones, where the sidebar is hidden */}
      <Link to="/" className="md:hidden" aria-label="SiteReady home">
        <BrandMark compact />
      </Link>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm md:flex">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.to}>
            {index > 0 && <span className="text-muted-foreground/60">/</span>}
            {index === crumbs.length - 1 ? (
              <span className="truncate font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="text-muted-foreground hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </Fragment>
        ))}
      </nav>
      <div className="flex-1 md:hidden" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-11 gap-2.5 px-2" aria-label="Account menu">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {getInitials(user?.name)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium">{user?.name}</span>
              <span className="block text-xs capitalize text-muted-foreground">{user?.role}</span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-medium">{user?.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={logout} className="min-h-11 cursor-pointer">
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
