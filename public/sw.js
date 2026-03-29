// Service Worker — network-first for pages so Next.js HTML + hashed chunks stay in sync after deploy.
// v1 cache-first on '/' caused stale HTML → old _next/static URLs → broken JS → infinite Loading on mobile.

const CACHE_NAME = 'synax-v3-assets';
const OFFLINE_ASSETS = ['/images/logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

function isNavigationOrDocument(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never serve cached HTML/shell: always hit network for documents (Next.js needs fresh build refs).
  if (isNavigationOrDocument(request)) {
    event.respondWith(fetch(request));
    return;
  }

  // Same-origin API: always network (prices, auth proxies, etc.)
  const url = new URL(request.url);
  const scopeOrigin = new URL(self.registration.scope).origin;
  if (url.origin === scopeOrigin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static files: try cache, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        const sameOrigin = url.origin === scopeOrigin;
        if (res.ok && request.method === 'GET' && sameOrigin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
