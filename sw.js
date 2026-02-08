const CACHE_NAME = 'busbibliotheek-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/logo_light.png',
  '/logo_dark.png',
  '/navicon.png',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap'
];

// Install event: cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
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

// Fetch event: network-first strategy for dynamic content, cache-first for static assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs not in cache list
  if (request.method !== 'GET') {
    return;
  }

  // API calls: network-first (always try fresh data)
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
  } else {
    // Static assets: cache-first
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
  }
});
