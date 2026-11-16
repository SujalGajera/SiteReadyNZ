import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/routing/RouteGuards'
import LoginPage from '@/pages/auth/Login'
import RegisterPage from '@/pages/auth/Register'
import HomePage from '@/pages/Home'

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
          <Route path="/" element={<HomePage />} />
        </Route>
      </Route>

      {/* Anything unknown goes home, and the guards decide where that leads */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
