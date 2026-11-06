const CACHE='nufud-v82';
const CORE=['./','./index.html','./three.min.js','./manifest.webmanifest','./icon-192.png?v=5','./icon-512.png?v=5','./apple-touch-icon.png?v=5'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);if(u.pathname.endsWith('.mp3')||e.request.headers.has('range'))return;const nav=e.request.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/nufud')||u.pathname.endsWith('/')||u.pathname.endsWith('sw.js')||u.pathname.endsWith('.webmanifest');
  if(nav){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(h=>h||caches.match('./index.html')||caches.match('./'))));return}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r})));
});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||'قلاع النفود',{body:d.body||'',tag:d.tag||'nf',renotify:true,icon:'icon-192.png?v=5',badge:'icon-192.png?v=5',dir:'rtl',lang:'ar',data:{url:'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus()}return self.clients.openWindow('./')}))});
