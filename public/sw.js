const APP_VERSION = 'v1.2.5';
const CACHE_NAME = 'dastgah-yar-' + APP_VERSION;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/apple-touch-icon.png'
];

// Install: Cache core app shell and immediately activate
self.addEventListener('install', (event) => {
  console.log(`[PWA ServiceWorker] Installing ${APP_VERSION}...`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA ServiceWorker] Pre-cache warning:', err);
      });
    }).then(() => {
      // Don't wait, immediately install
      return self.skipWaiting();
    })
  );
});

// Activate: Clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log(`[PWA ServiceWorker] Activated ${APP_VERSION}`);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA ServiceWorker] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigation, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests or different schemes
  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Static assets (scripts, styles, fonts, images)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      }).catch(() => {
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data) {
    if (event.data.type === 'SKIP_WAITING') {
      console.log('[PWA ServiceWorker] SKIP_WAITING received');
      self.skipWaiting();
    }
    if (event.data.type === 'GET_VERSION') {
      event.ports[0]?.postMessage({ version: APP_VERSION });
    }
  }
});
