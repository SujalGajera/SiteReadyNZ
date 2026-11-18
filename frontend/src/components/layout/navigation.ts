import { ClipboardCheck, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react'
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
  { label: 'Equipment', to: '/equipment', icon: ShieldCheck, roles: ['manager'] },
  { label: 'Inspections', to: '/inspections', icon: ClipboardCheck, roles: ['manager', 'staff'] },
  { label: 'Staff', to: '/staff', icon: UsersRound, roles: ['manager'] },
]
