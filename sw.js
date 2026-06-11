const CACHE = 'opdcj-v21.8';
const SHELL = [
  '/opdcj-/',
  '/opdcj-/index.html',
  '/opdcj-/manifest.json',
  '/opdcj-/icon-192.png',
  '/opdcj-/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== 'opdcj-fonts').map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Google Fonts — stale-while-revalidate (sert le cache, rafraîchit en fond)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open('opdcj-fonts').then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          });
          return cached || fresh;
        })
      )
    );
    return;
  }

  // App shell (même origine) — cache-first, mise en cache à la volée
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
