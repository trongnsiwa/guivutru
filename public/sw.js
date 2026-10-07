// Service Worker for Gửi Vũ Trụ (v2.2 PWA)
// - Offline read for /toi and /note/:id
// - Strictly excludes /viet submissions from offline write (v3 concern)

const CACHE_NAME = 'gvt-cache-v2-2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. CRITICAL CONSTRAINT (§4.3): Do NOT cache /viet submission or any POST/PUT/DELETE requests
  if (request.method !== 'GET') {
    return;
  }
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('/cron/')) {
    // Let dynamic API requests pass through
    return;
  }

  // 2. Navigation requests: Network-first, fallback to cache (enables offline /toi and /note/:id)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, clone and cache for offline read
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Cache HTML shell
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: match requested route or app shell
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Static assets & fonts: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
