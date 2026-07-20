const CACHE = 'ravitoai-v23';
const ASSETS = [
  './',
  './index.html?v=23',
  './styles.css?v=23',
  './catalog-v2.js?v=23',
  './app.js?v=23',
  './inventory.js?v=23',
  './features-v3.js?v=23',
  './ravicheck-auto.js?v=23',
  './beta-v17.js?v=23',
  './beta-v21.js?v=23',
  './project-fixes.js?v=23',
  './training-mode.js?v=23',
  './universe.js?v=23',
  './manifest.webmanifest?v=23'
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const request=event.request,isNavigation=request.mode==='navigate';event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||(isNavigation?caches.match('./index.html?v=23'):undefined))))});