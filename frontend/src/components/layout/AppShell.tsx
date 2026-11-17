import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { OfflineBanner } from './OfflineBanner'

/**
 * Frame around every signed-in page: sidebar on the left (desktop), a slim header (phones),
 * the offline banner, then the page itself, which arrives through <Outlet />.
 */
export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <OfflineBanner />
        <main className="flex-1 px-4 pb-16 pt-6 md:px-10 md:pt-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
