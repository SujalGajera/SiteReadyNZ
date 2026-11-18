import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/routing/RouteGuards'
import LoginPage from '@/pages/auth/Login'
import RegisterPage from '@/pages/auth/Register'
import RootRedirect from '@/pages/RootRedirect'
import EquipmentDashboardPage from '@/pages/manager/Dashboard'
import EquipmentDetailPage from '@/pages/manager/EquipmentDetail'
import StaffListPage from '@/pages/manager/StaffList'
import InspectionsRoute from '@/pages/InspectionsRoute'
import ChecklistViewPage from '@/pages/staff/ChecklistView'

// Route table. Manager-only and staff-only pages are added as <ProtectedRoute roles={[...]}> groups
// in the phases that build them.
export default function App() {
  return (
    <Routes>
      {/* Signed-out pages */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Signed-in pages (any role) inside the app frame */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/inspections" element={<InspectionsRoute />} />

          {/* Staff-only: the checklist itself */}
          <Route element={<ProtectedRoute roles={['staff']} />}>
            <Route path="/inspections/:id" element={<ChecklistViewPage />} />
          </Route>

          {/* Manager-only pages. Staff who type these URLs are sent home. */}
          <Route element={<ProtectedRoute roles={['manager']} />}>
            <Route path="/equipment" element={<EquipmentDashboardPage />} />
            <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
            <Route path="/staff" element={<StaffListPage />} />
          </Route>
        </Route>
      </Route>

      {/* Anything unknown goes home, and the guards decide where that leads */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
