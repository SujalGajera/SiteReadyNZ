import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import HomePage from '@/pages/Home'

// Route table. Pages are added here as each development phase lands.
export default function App() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <AppShell>
            <HomePage />
          </AppShell>
        }
      />
    </Routes>
  )
}
