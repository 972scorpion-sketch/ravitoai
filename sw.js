const CACHE = 'ravitoai-v9';
const ASSETS = [
  './',
  './index.html?v=9',
  './styles.css?v=9',
  './catalog-v2.js?v=9',
  './app.js?v=9',
  './inventory.js?v=9',
  './features-v3.js?v=9',
  './ravicheck-auto.js?v=9',
  './manifest.webmanifest?v=9'
];
self.addEventListener('install', event => {self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)))});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()))});
self.addEventListener('fetch', event => {if(event.request.method!=='GET')return;const request=event.request,isNavigation=request.mode==='navigate';event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||(isNavigation?caches.match('./index.html?v=9'):undefined))))});