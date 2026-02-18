const CACHE_NAME = 'busbibliotheek-v20';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/style.css',
  '/style.css?v=20260218-2',
  '/translations.js',
  '/translations.js?v=20260218-1',
  '/media/logo.png',
  '/media/logo_light.png',
  '/media/logo_dark.png',
  '/media/navicon.png',
  '/media/hansea.png'
];
const OPTIONAL_ASSETS = [
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@500;600;700&display=swap'
];

// Install event: cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const allAssets = [...CORE_ASSETS, ...OPTIONAL_ASSETS];
      await Promise.allSettled(
        allAssets.map(async (url) => {
          try {
            await cache.add(url);
          } catch (_) {
            // Keep install resilient: one failing asset must not break offline support.
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // HTML navigation: network first with offline fallback page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const offlinePage = await caches.match('/offline.html', { ignoreSearch: true });
          if (offlinePage) return offlinePage;
          const cachedIndex = await caches.match('/index.html', { ignoreSearch: true });
          return cachedIndex || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
          });
        })
    );
    return;
  }

  // API/external calls: network first, fallback to cache
  if (url.hostname !== self.location.hostname || url.pathname.includes('/api')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clonedResponse));
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(request);
        })
    );
  } else { // Static assets: stale-while-revalidate
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
  }
});
