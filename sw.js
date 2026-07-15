const CACHE = 'ravitoai-v7';
const ASSETS = [
  './',
  './index.html?v=7',
  './styles.css?v=7',
  './catalog-v2.js?v=7',
  './app.js?v=7',
  './inventory.js?v=7',
  './auto-plan.js?v=7',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const isNavigation = request.mode === 'navigate';

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || (isNavigation ? caches.match('./index.html?v=7') : undefined)))
  );
});