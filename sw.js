const CACHE = 'ravitoai-v8';
const ASSETS = [
  './',
  './index.html?v=8',
  './styles.css?v=8',
  './catalog-v2.js?v=8',
  './app.js?v=8',
  './inventory.js?v=8',
  './auto-plan.js?v=8',
  './features-v3.js?v=8',
  './manifest.webmanifest?v=8'
];
self.addEventListener('install', event => {self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)))});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()))});
self.addEventListener('fetch', event => {if(event.request.method!=='GET')return;const request=event.request,isNavigation=request.mode==='navigate';event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||(isNavigation?caches.match('./index.html?v=8'):undefined))))});