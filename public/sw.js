// Very small service worker for offline-first static assets
const CACHE = 'fr-pron-trainer-v1';
// Scope-aware base path for Project Pages
const BASE = new URL(self.registration.scope).pathname; // e.g. '/repo/' or '/'
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'favicon.ico',
  BASE + 'manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only handle same-origin GET
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navigation requests: network-first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(BASE, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(BASE) || caches.match(BASE + 'index.html'))
    );
    return;
  }

  // Static assets: cache-first, fallback to network
  if (url.pathname.startsWith(BASE + 'assets/') || url.pathname === BASE + 'favicon.ico') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        });
      })
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
