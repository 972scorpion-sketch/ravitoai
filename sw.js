const CACHE = 'ravitoai-v24';
const ASSETS = [
  './',
  './index.html?v=24',
  './styles.css?v=24',
  './catalog-v2.js?v=24',
  './app.js?v=24',
  './inventory.js?v=24',
  './features-v3.js?v=24',
  './ravicheck-auto.js?v=24',
  './beta-v17.js?v=24',
  './beta-v21.js?v=24',
  './beta-v22.js?v=24',
  './post-session-v24.js?v=24',
  './project-fixes.js?v=24',
  './training-mode.js?v=24',
  './universe.js?v=24',
  './manifest.webmanifest?v=24'
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const request=event.request,isNavigation=request.mode==='navigate';event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||(isNavigation?caches.match('./index.html?v=24'):undefined))))});