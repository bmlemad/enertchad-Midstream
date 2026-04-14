/* EnerTchad Service Worker — minimal cache-first for static assets */
const VERSION='enertchad-v1';
const STATIC=['/','/index.html','/logo.svg','/manifest.json'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(STATIC).catch(function(){})}));
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==VERSION}).map(function(k){return caches.delete(k)}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);
  // Skip cross-origin (Open-Meteo, fonts, etc)
  if(url.origin!==self.location.origin)return;
  // Cache-first for static assets
  if(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(url.pathname)){
    e.respondWith(
      caches.match(e.request).then(function(cached){
        return cached||fetch(e.request).then(function(resp){
          if(resp.ok){var clone=resp.clone();caches.open(VERSION).then(function(c){c.put(e.request,clone)})}
          return resp;
        }).catch(function(){return cached})
      })
    );
    return;
  }
  // Network-first for HTML/JSON
  e.respondWith(
    fetch(e.request).then(function(resp){
      if(resp.ok&&(/\.html$/.test(url.pathname)||url.pathname==='/'||/\.json$/.test(url.pathname))){
        var clone=resp.clone();
        caches.open(VERSION).then(function(c){c.put(e.request,clone)});
      }
      return resp;
    }).catch(function(){return caches.match(e.request).then(function(c){return c||caches.match('/')})})
  );
});
