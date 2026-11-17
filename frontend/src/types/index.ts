// All shared TypeScript interfaces for the SiteReady NZ application.
// Keeping types in one place means every component, hook, and service stays in sync.

/** The two kinds of account in the app */
export type UserRole = 'manager' | 'staff'

/** A signed-in user as returned by the API. The login token is NOT part of it: it lives in an httpOnly cookie. */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

/** The server's answer to a failed request. `errors` lists the fields that failed validation. */
export interface ApiErrorBody {
  error: string
  errors?: { field: string; message: string }[]
}

/** A single piece of emergency equipment managed by the system */
export type EquipmentType = 'fire_extinguisher' | 'first_aid' | 'aed' | 'safety_sign' | 'other'
export type EquipmentStatus = 'ok' | 'due_soon' | 'overdue' | 'expired'

export interface Equipment {
  _id: string
  name: string
  type: EquipmentType
  location: string
  serialNumber?: string
  purchaseDate?: string // ISO date string
  expiryDate: string // ISO date string, used to calculate status
  /** Calculated from expiryDate. Never sent by the client. */
  status: EquipmentStatus
  lastInspectedAt?: string
  /** The manager who added it. The API fills in their name. */
  assignedManagerId?: { id: string; name: string } | null
}

/** What the add/edit form sends. Optional fields are empty strings when left blank. */
export interface EquipmentFormValues {
  name: string
  type: EquipmentType
  location: string
  serialNumber: string
  purchaseDate: string
  expiryDate: string
}

/** One item within a checklist, recording the inspector's finding */
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

/** A single inspection job: ties equipment to a staff member and their checklist results */
export interface Inspection {
  _id: string
  equipmentId: string
  assignedStaffId: string
  scheduledDate: string // ISO date string
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
