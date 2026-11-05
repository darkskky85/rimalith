const CACHE='nufud-v32';
const CORE=['./','./index.html','./three.min.js','./manifest.webmanifest','./icon-192.png?v=5','./icon-512.png?v=5','./apple-touch-icon.png?v=5'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);if(u.pathname.endsWith('.mp3')||e.request.headers.has('range'))return;const nav=e.request.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/nufud')||u.pathname.endsWith('/')||u.pathname.endsWith('sw.js')||u.pathname.endsWith('.webmanifest');
  if(nav){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(h=>h||caches.match('./index.html')||caches.match('./'))));return}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r})));
});
