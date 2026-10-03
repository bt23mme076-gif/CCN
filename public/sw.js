self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => new Response('Offline.')));
});

self.addEventListener('push', (e) => {
  if (!e.data) return;
  const { title, body, url, tag } = e.data.json();
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: url || '/dashboard' },
      tag: tag || undefined,
      renotify: !!tag, // re-vibrate/re-alert even if a notification with this tag is already showing
      requireInteraction: true, // stays on screen until dismissed, instead of auto-disappearing in a few seconds
      vibrate: [300, 150, 300, 150, 300],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/dashboard'));
});
