import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { OfflineBanner } from './OfflineBanner'

/**
 * Frame around every signed-in page: sidebar on the left (desktop), top bar,
 * offline banner, then the page itself. Phones get the drawer menu instead of the sidebar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <OfflineBanner />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
