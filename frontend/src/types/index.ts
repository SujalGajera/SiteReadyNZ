// All shared TypeScript interfaces for the SiteReady NZ application.
// Keeping types in one place means every component, hook, and service stays in sync.

/** The two kinds of account in the app */
export type UserRole = 'manager' | 'staff'

/** A logged-in user � returned by the auth API and stored in AuthContext */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  token: string
}

/** A single piece of emergency equipment managed by the system */
export interface Equipment {
  _id: string
  name: string
  /** Category of equipment, e.g. fire_extinguisher, aed */
  type: 'fire_extinguisher' | 'first_aid' | 'aed' | 'safety_sign' | 'other'
  location: string
  serialNumber: string
  purchaseDate: string // ISO date string
  expiryDate: string   // ISO date string — used to calculate status
  /** Auto-calculated field based on expiryDate */
  status: 'ok' | 'due_soon' | 'overdue' | 'expired'
  lastInspectedAt: string | null
  assignedManagerId?: string
}

/** One item within a checklist — records the inspector's finding */
export interface ChecklistItem {
  itemId: string
  description: string
  /** Groups items under a heading, e.g. "FIRE EQUIPMENT" */
  category: string
  result: 'pass' | 'fail' | 'flag' | 'not_checked'
  notes: string
  /** Only relevant when result === 'fail' */
  severity: 'low' | 'medium' | 'critical' | null
}

/** A single inspection job — ties equipment to a staff member and their checklist results */
export interface Inspection {
  _id: string
  equipmentId: string
  assignedStaffId: string
  scheduledDate: string   // ISO date string
  completedAt: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  /** Tracks whether this inspection has been uploaded to the server */
  syncStatus: 'synced' | 'pending_sync' | 'failed'
  items: ChecklistItem[]
  // Populated fields returned by the API (may not always be present)
  equipmentName?: string
  staffName?: string
  location?: string
}

/** Push notification subscription details stored on the server */
export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}
