const CACHE = 'ravitoai-v14';
const ASSETS = [
  './',
  './index.html?v=14',
  './styles.css?v=14',
  './catalog-v2.js?v=14',
  './app.js?v=14',
  './inventory.js?v=14',
  './features-v3.js?v=14',
  './ravicheck-auto.js?v=14',
  './training-mode.js?v=14',
  './manifest.webmanifest?v=14'
];
self.addEventListener('install', event => {self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)))});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()))});
self.addEventListener('fetch', event => {if(event.request.method!=='GET')return;const request=event.request,isNavigation=request.mode==='navigate';event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||(isNavigation?caches.match('./index.html?v=14'):undefined))))});