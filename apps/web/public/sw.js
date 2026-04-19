// Basic Service Worker for SmartInventory
const CACHE_NAME = 'smart-inventory-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and internal Next.js/HMR traffic
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('_next') || 
    event.request.url.includes('webpack') ||
    event.request.url.includes('localhost') ||
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(event.request).catch(() => {
        // Optional: return a custom offline page for navigation requests
        return null;
      });
    })
  );
});
