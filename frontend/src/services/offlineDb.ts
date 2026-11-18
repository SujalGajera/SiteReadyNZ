// services/offlineDb.ts — Everything SiteReady keeps on the device (IndexedDB).
//
// Three stores:
//   inspections  a copy of a staff member's task list, so it can be read with no signal
//   drafts       answers that are filled in but not submitted yet, so closing the app loses nothing
//   outbox       finished checklists waiting to be uploaded (the important one)
//
// This file is also imported by the service worker, so it must not touch `window` or the DOM.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Inspection, OutboxEntry, SubmittedAnswer } from '@/types'

export interface CachedInspection {
  _id: string
  userId: string
  savedAt: string
  data: Inspection
}

export interface Draft {
  inspectionId: string
  userId: string
  updatedAt: string
  /** itemId -> the answer so far */
  answers: Record<string, { result: SubmittedAnswer['result']; notes: string }>
}

interface SiteReadyDb extends DBSchema {
  inspections: { key: string; value: CachedInspection; indexes: { byUser: string } }
  drafts: { key: string; value: Draft }
  outbox: { key: string; value: OutboxEntry; indexes: { byUser: string } }
}

const DB_NAME = 'siteready-db'
const DB_VERSION = 2

let databasePromise: Promise<IDBPDatabase<SiteReadyDb>> | undefined

/** Opens the database once and reuses it. Creates or upgrades the stores when needed. */
function getDatabase(): Promise<IDBPDatabase<SiteReadyDb>> {
  databasePromise ??= openDB<SiteReadyDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Version 1 (an earlier draft of the app) used different store names; start clean
      for (const name of Array.from(db.objectStoreNames)) db.deleteObjectStore(name)

      db.createObjectStore('inspections', { keyPath: '_id' }).createIndex('byUser', 'userId')
      db.createObjectStore('drafts', { keyPath: 'inspectionId' })
      db.createObjectStore('outbox', { keyPath: 'submissionId' }).createIndex('byUser', 'userId')
    },
  })
  return databasePromise
}

// ---------- cached task list ----------

/** Replaces this person's cached task list with fresh data from the server */
export async function cacheInspections(userId: string, inspections: Inspection[]): Promise<void> {
  const db = await getDatabase()
  const tx = db.transaction('inspections', 'readwrite')
  const existing = await tx.store.index('byUser').getAllKeys(userId)
  await Promise.all(existing.map((key) => tx.store.delete(key)))
  const savedAt = new Date().toISOString()
  await Promise.all(inspections.map((data) => tx.store.put({ _id: data._id, userId, savedAt, data })))
  await tx.done
}

export async function getCachedInspections(userId: string): Promise<{ inspections: Inspection[]; savedAt: string | null }> {
  const db = await getDatabase()
  const rows = await db.getAllFromIndex('inspections', 'byUser', userId)
  return { inspections: rows.map((row) => row.data), savedAt: rows[0]?.savedAt ?? null }
}

/** Removes the cached task lists. Called on sign-out so the next person on a shared phone cannot read them. */
export async function clearCachedInspections(): Promise<void> {
  const db = await getDatabase()
  await db.clear('inspections')
}

// ---------- drafts ----------

export async function saveDraft(draft: Draft): Promise<void> {
  const db = await getDatabase()
  await db.put('drafts', draft)
}

export async function getDraft(inspectionId: string, userId: string): Promise<Draft | undefined> {
  const db = await getDatabase()
  const draft = await db.get('drafts', inspectionId)
  return draft?.userId === userId ? draft : undefined
}

export async function getDrafts(userId: string): Promise<Draft[]> {
  const db = await getDatabase()
  return (await db.getAll('drafts')).filter((draft) => draft.userId === userId)
}

export async function deleteDraft(inspectionId: string): Promise<void> {
  const db = await getDatabase()
  await db.delete('drafts', inspectionId)
}

// ---------- outbox ----------

export async function addToOutbox(entry: OutboxEntry): Promise<void> {
  const db = await getDatabase()
  await db.put('outbox', entry)
}

/** Every entry on the device. The uploader sends all of them; the server checks who each belongs to. */
export async function getAllOutbox(): Promise<OutboxEntry[]> {
  const db = await getDatabase()
  return db.getAll('outbox')
}

/** Only this person's entries, for showing "2 waiting to upload" */
export async function getOutboxFor(userId: string): Promise<OutboxEntry[]> {
  const db = await getDatabase()
  return db.getAllFromIndex('outbox', 'byUser', userId)
}

export async function removeFromOutbox(submissionId: string): Promise<void> {
  const db = await getDatabase()
  await db.delete('outbox', submissionId)
}

export async function markOutboxFailed(submissionId: string, error: string): Promise<void> {
  const db = await getDatabase()
  const entry = await db.get('outbox', submissionId)
  if (entry) await db.put('outbox', { ...entry, state: 'failed', error })
}
