import type { AvnacDocumentV1 } from './avnac-document'

const DB_NAME = 'avnac-editor'
const DB_VERSION = 1
const STORE = 'documents'

export type AvnacEditorIdbRecord = {
  id: string
  updatedAt: number
  document: AvnacDocumentV1
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
}

export async function idbGetDocument(
  id: string,
): Promise<AvnacDocumentV1 | null> {
  const db = await openDb()
  try {
    return await new Promise<AvnacDocumentV1 | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      tx.onerror = () => reject(tx.error ?? new Error('idb read failed'))
      const r = tx.objectStore(STORE).get(id)
      r.onerror = () => reject(r.error ?? new Error('idb get failed'))
      r.onsuccess = () => {
        const row = r.result as AvnacEditorIdbRecord | undefined
        resolve(row?.document ?? null)
      }
    })
  } finally {
    db.close()
  }
}

export async function idbPutDocument(
  id: string,
  document: AvnacDocumentV1,
): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.onerror = () => reject(tx.error ?? new Error('idb write failed'))
      tx.oncomplete = () => resolve()
      tx.objectStore(STORE).put({
        id,
        updatedAt: Date.now(),
        document,
      } satisfies AvnacEditorIdbRecord)
    })
  } finally {
    db.close()
  }
}
