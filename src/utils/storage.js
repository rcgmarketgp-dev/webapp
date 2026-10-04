import { defaultProfile, sampleDevices } from '../data/sampleData';

const DEVICES_KEY = 'dastgah_yar_devices_v1';
const PROFILE_KEY = 'dastgah_yar_profile_v1';
const IDB_NAME = 'DastgahYarDataDB';
const IDB_STORE = 'app_data';

function openDataDb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function saveToIndexedDB(key, val) {
  try {
    const db = await openDataDb();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(val, key);
  } catch (e) {
    console.warn('IDB save warning:', e);
  }
}

export function loadDevices() {
  try {
    const raw = localStorage.getItem(DEVICES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load devices from localStorage', e);
  }
  // Initialize with sample demo devices only on first launch
  saveDevices(sampleDevices);
  return sampleDevices;
}

export function saveDevices(devices) {
  try {
    localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
    saveToIndexedDB('devices', devices);
  } catch (e) {
    console.warn('LocalStorage save failed, falling back to IndexedDB:', e);
    saveToIndexedDB('devices', devices);
  }
}

export function loadSellerProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw !== null) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load profile', e);
  }
  return defaultProfile;
}

export function saveSellerProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    saveToIndexedDB('profile', profile);
  } catch (e) {
    console.warn('LocalStorage save profile failed, falling back to IndexedDB:', e);
    saveToIndexedDB('profile', profile);
  }
}

