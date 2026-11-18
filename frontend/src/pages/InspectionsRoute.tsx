import { useAuth } from '@/hooks/useAuth'
import ManagerInspectionsPage from '@/pages/manager/Inspections'
import StaffInspectionListPage from '@/pages/staff/InspectionList'

/** /inspections is one address with two screens: managers oversee, staff work through their list */
export default function InspectionsRoute() {
  const { user } = useAuth()
  return user?.role === 'manager' ? <ManagerInspectionsPage /> : <StaffInspectionListPage />
}
