const CACHE = 'ravitoai-v21';
const ASSETS = [
  './',
  './index.html?v=21',
  './styles.css?v=21',
  './catalog-v2.js?v=21',
  './app.js?v=21',
  './inventory.js?v=21',
  './features-v3.js?v=21',
  './ravicheck-auto.js?v=21',
  './beta-v17.js?v=21',
  './beta-v21.js?v=21',
  './project-fixes.js?v=21',
  './training-mode.js?v=21',
  './universe.js?v=21',
  './manifest.webmanifest?v=21'
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const request=event.request,isNavigation=request.mode==='navigate';event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||(isNavigation?caches.match('./index.html?v=21'):undefined))))});