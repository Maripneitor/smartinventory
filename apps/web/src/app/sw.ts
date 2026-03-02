// Basic Service Worker for Offline-First functionality
const CACHE_NAME = 'smart-inventory-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background Sync
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-inventory') {
    // In a real scenario, we would trigger the sync here.
    // However, since we need Supabase Auth, it's easier to handle it
    // from the main thread via the 'online' event for now.
    console.log('Background sync triggered');
  }
});
