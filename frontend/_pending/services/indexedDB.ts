import { openDB, type IDBPDatabase } from 'idb'
import type { Inspection } from '../types'

const DB_NAME = 'siteready-db'
const DB_VERSION = 1

// Store names — using constants to avoid typos across the codebase
const OFFLINE_STORE = 'offline-inspections'
const CACHED_STORE = 'cached-inspections'

/** Opens (or creates) the IndexedDB database with the required object stores */
async function getDatabase(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // offline-inspections: inspections filled in while offline, waiting to sync
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        db.createObjectStore(OFFLINE_STORE, { keyPath: '_id' })
      }
      // cached-inspections: server data downloaded while online for offline reading
      if (!db.objectStoreNames.contains(CACHED_STORE)) {
        db.createObjectStore(CACHED_STORE, { keyPath: '_id' })
      }
    },
  })
}

/** Saves a completed-offline inspection to the outbox queue */
export async function saveOfflineSubmission(inspection: Inspection): Promise<void> {
  const db = await getDatabase()
  await db.put(OFFLINE_STORE, inspection)
}

/** Returns all inspections waiting to be synced to the server */
export async function getOfflineSubmissions(): Promise<Inspection[]> {
  const db = await getDatabase()
  return db.getAll(OFFLINE_STORE)
}

/** Removes one offline submission after it has been successfully uploaded */
export async function deleteOfflineSubmission(id: string): Promise<void> {
  const db = await getDatabase()
  await db.delete(OFFLINE_STORE, id)
}

/** Replaces the entire cached-inspections store with fresh data from the server */
export async function cacheInspections(inspections: Inspection[]): Promise<void> {
  const db = await getDatabase()
  // Use a transaction so the update is atomic — either all or none are saved
  const tx = db.transaction(CACHED_STORE, 'readwrite')
  await Promise.all([
    ...inspections.map((inspection) => tx.store.put(inspection)),
    tx.done,
  ])
}

/** Returns all inspections previously cached from the server */
export async function getCachedInspections(): Promise<Inspection[]> {
  const db = await getDatabase()
  return db.getAll(CACHED_STORE)
}

/** Returns a single cached inspection by its ID, or undefined if not cached */
export async function getCachedInspectionById(id: string): Promise<Inspection | undefined> {
  const db = await getDatabase()
  return db.get(CACHED_STORE, id)
}
