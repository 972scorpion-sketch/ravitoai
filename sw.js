const CACHE = 'ravitoai-v17';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=16',
  './catalog-v2.js?v=16',
  './app.js?v=16',
  './inventory.js?v=16',
  './features-v3.js?v=16',
  './ravicheck-auto.js?v=16',
  './beta-v17.js?v=17',
  './training-mode.js?v=16',
  './universe.js?v=16',
  './manifest.webmanifest?v=16'
];
self.addEventListener('install', event => {self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)))});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()))});
self.addEventListener('fetch', event => {if(event.request.method!=='GET')return;const request=event.request,isNavigation=request.mode==='navigate';event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||(isNavigation?caches.match('./index.html'):undefined))))});