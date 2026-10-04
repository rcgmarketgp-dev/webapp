/**
 * IndexedDB helper to persist FileSystemDirectoryHandle across page reloads
 */

const DB_NAME = 'DastgahYarDirDB';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const KEY_DIR = 'selected_drive_directory';

function openDirDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStoredDirectoryHandle(handle, folderName) {
  try {
    const db = await openDirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ handle, name: folderName || handle.name, savedAt: Date.now() }, KEY_DIR);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save directory handle to IndexedDB:', err);
    return false;
  }
}

export async function getStoredDirectoryHandle() {
  try {
    const db = await openDirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_DIR);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not retrieve directory handle from IndexedDB:', err);
    return null;
  }
}

export async function clearStoredDirectoryHandle() {
  try {
    const db = await openDirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(KEY_DIR);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not clear directory handle:', err);
    return false;
  }
}
