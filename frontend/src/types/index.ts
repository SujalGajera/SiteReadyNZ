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
  /** Calculated from the expiry date and the last check. Never sent by the client. */
  status: EquipmentStatus
  lastInspectedAt?: string
  createdAt?: string
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

// ---------- Inspections ----------

export type ChecklistAnswer = 'pass' | 'fail' | 'flag'
export type ChecklistResult = ChecklistAnswer | 'not_checked'
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

/** One question on a checklist and its answer */
export interface ChecklistItem {
  itemId: string
  description: string
  /** Heading the question is grouped under, e.g. "Working condition" */
  category: string
  severity: 'low' | 'medium' | 'critical'
  result: ChecklistResult
  notes?: string
}

/** The few equipment fields an inspection carries with it */
export interface EquipmentSummary {
  _id: string
  name: string
  type: EquipmentType
  location: string
}

/** A job: one piece of equipment, one staff member, one due day */
export interface Inspection {
  _id: string
  equipmentId: EquipmentSummary
  /** A name object for managers' lists, a plain id in a staff member's own list */
  assignedStaffId: string | { _id: string; name: string; email: string }
  scheduledDate: string // ISO date, a calendar day
  completedAt: string | null
  status: InspectionStatus
  syncStatus: 'synced' | 'pending_sync' | 'failed'
  items: ChecklistItem[]
}

/** What the manager's "assign" form sends */
export interface AssignInspectionValues {
  equipmentId: string
  assignedStaffId: string
  scheduledDate: string
}

/** One answer as it is sent to the server */
export interface SubmittedAnswer {
  itemId: string
  result: ChecklistAnswer
  notes: string
}

/** A finished checklist, waiting on the device to be uploaded */
export interface OutboxEntry {
  /** Random id made on the phone. The server uses it to ignore a repeated upload. */
  submissionId: string
  inspectionId: string
  /** Who finished it. Only that person's session may upload it. */
  userId: string
  /** For display while it waits ("Extinguisher, hall") */
  equipmentName: string
  /** When the person pressed Submit, on the phone's clock */
  completedAt: string
  items: SubmittedAnswer[]
  /** waiting = will be retried; failed = the server refused it, a person needs to look */
  state: 'waiting' | 'failed'
  error?: string
}

/** Push notification subscription details stored on the server */
export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}
