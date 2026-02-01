/**
 * sw.js
 * Service Worker for MiSaldo PWA
 * Caches all static assets for offline use.
 */

const CACHE_NAME = 'misaldo-pwa-v2';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './static/manifest.json',
    './static/js/app.js',
    './static/js/db.js',
    './static/js/auth.js',
    './static/js/router.js',
    './static/img/logo2.png',
    './static/img/icon-192.png',
    './static/img/icon-512.png',

    // External Dependencies (CDNs) - Critical for offline
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap'
];

// Install: Cache everything
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching all assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Fetch: Network First, then Cache (or Stale-While-Revalidate could be better for assets, but PWA usually Cache First for Shell)
// For this app: Cache First for immutable assets, Network First for data (but data is local IDB anyway).
// So Strategy: Cache First, falling back to Network.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Cache hit - return response
            if (response) {
                return response;
            }
            // Not in cache - fetch from network
            return fetch(event.request).then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});
