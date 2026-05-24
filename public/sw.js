self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // A completely basic fetch handler is enough to trigger the Chrome PWA install prompt
  e.respondWith(fetch(e.request).catch(() => new Response('Offline.')));
});
