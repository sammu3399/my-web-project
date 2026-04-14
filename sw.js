self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch for PWA requirement. No caching to ensure no errors.
  e.respondWith(fetch(e.request).catch(() => new Response("Network error")));
});
