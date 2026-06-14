const CACHE = 'opdcj-v21.54';
const SHELL = [
  '/OPDCJ/',
  '/OPDCJ/index.html',
  '/OPDCJ/manifest.json',
  '/OPDCJ/icon-192.png',
  '/OPDCJ/icon-512.png',
  '/OPDCJ/logo_opdcj_final.png',
  '/OPDCJ/fonts/playfair-600.woff2',
  '/OPDCJ/fonts/playfair-700.woff2',
  '/OPDCJ/fonts/nunito-400.woff2',
  '/OPDCJ/fonts/nunito-500.woff2',
  '/OPDCJ/fonts/nunito-600.woff2',
  '/OPDCJ/fonts/nunito-700.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // App shell + polices (même origine) — cache-first, mise en cache à la volée
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }))
    );
    return;
  }

  // Autres origines — réseau avec fallback cache
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
