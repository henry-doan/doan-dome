/**
 * A tiny IndexedDB wrapper: the whole library is stored as one record.
 * IndexedDB has room for the images inside presentations; localStorage doesn't.
 */

const DB_NAME = 'doan-dome'
const STORE = 'library'
const KEY = 'library'

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

let database = null
const getDatabase = async () => {
  database ??= await openDatabase()
  return database
}

const run = async (mode, operation) => {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = operation(transaction.objectStore(STORE))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export const writeLibrary = (library) => run('readwrite', (store) => store.put(library, KEY))

export const readLibrary = async () => {
  try {
    return (await run('readonly', (store) => store.get(KEY))) ?? null
  } catch {
    // Storage unavailable (some private modes): start with the sample sky.
    return null
  }
}
