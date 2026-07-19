const CACHE = 'ravitoai-v20';
const ASSETS = [
  './',
  './index.html?v=20',
  './styles.css?v=20',
  './catalog-v2.js?v=20',
  './app.js?v=20',
  './inventory.js?v=20',
  './features-v3.js?v=20',
  './ravicheck-auto.js?v=20',
  './beta-v17.js?v=20',
  './project-fixes.js?v=20',
  './training-mode.js?v=20',
  './universe.js?v=20',
  './manifest.webmanifest?v=20'
];
self.addEventListener('install', event => {self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))) });
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET')return;
  const request=event.request,isNavigation=request.mode==='navigate';
  event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||(isNavigation?caches.match('./index.html?v=20'):undefined))))
});