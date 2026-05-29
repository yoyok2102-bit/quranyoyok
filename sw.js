const CACHE_NAME = 'annuur-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './prayer.js',
  './compass.js',
  './icons/icon.png',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Outfit:wght@300;400;500;600;700;800&family=Scheherazade+New:wght@400;700&display=swap',
  'https://unpkg.com/lucide@latest'
];

// Install Event
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching all static assets');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Cache First, fallback to Network)
self.addEventListener('fetch', e => {
  // Only cache GET requests and non-API requests (to keep Quran API dynamic or let API fail gracefully offline)
  if (e.request.method !== 'GET' || e.request.url.includes('api.v2') || e.request.url.includes('equran.id')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then(networkResponse => {
        // Cache new static requests
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
