import { LayoutGrid, type LucideIcon } from 'lucide-react'
import type { UserRole } from '@/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Which roles can see this link. Route guards in App.tsx enforce the same rule. */
  roles: UserRole[]
}

// One list drives both the desktop sidebar and the mobile drawer.
// New pages are added here as each phase lands.
export const navItems: NavItem[] = [
  { label: 'Overview', to: '/', icon: LayoutGrid, roles: ['manager', 'staff'] },
]

/** Friendly page names for the breadcrumb in the top bar */
export const routeLabels: Record<string, string> = {
  '': 'Overview',
}
