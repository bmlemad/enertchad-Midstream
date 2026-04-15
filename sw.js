/* ═══════════════════════════════════════════════════════════════════
 * EnerTchad Midstream Service Worker v2 — versioned cache
 * ═══════════════════════════════════════════════════════════════════ */

const SW_VERSION = 'enertchad-midstream-v2.0.1';
const CACHE_STATIC = SW_VERSION + '-static';
const CACHE_IMMUTABLE = SW_VERSION + '-immutable';
const CACHE_RUNTIME = SW_VERSION + '-runtime';

const PRECACHE = ['/', '/index.html', '/logo.svg', '/manifest.json', '/offline.html'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_STATIC).then(function(c){return c.addAll(PRECACHE).catch(function(){})}));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k.indexOf(SW_VERSION)!==0})
                            .map(function(k){return caches.delete(k)}));
    }).then(function(){return self.clients.claim()})
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;
  if(/\.(css|js)(\?v=|$)/.test(url.pathname + url.search) || /\.v\d+\.(css|js)$/.test(url.pathname)){
    e.respondWith(cacheFirst(e.request, CACHE_IMMUTABLE)); return;
  }
  if(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$/i.test(url.pathname)){
    e.respondWith(staleWhileRevalidate(e.request, CACHE_STATIC)); return;
  }
  e.respondWith(networkFirst(e.request, CACHE_RUNTIME));
});

function cacheFirst(req, cn){
  return caches.match(req).then(function(cached){
    if(cached) return cached;
    return fetch(req).then(function(resp){
      if(resp && resp.ok){var cl=resp.clone();caches.open(cn).then(function(c){c.put(req,cl)})}
      return resp;
    });
  });
}

function staleWhileRevalidate(req, cn){
  return caches.match(req).then(function(cached){
    var fp = fetch(req).then(function(resp){
      if(resp && resp.ok){var cl=resp.clone();caches.open(cn).then(function(c){c.put(req,cl)})}
      return resp;
    }).catch(function(){return cached});
    return cached || fp;
  });
}

function networkFirst(req, cn){
  return fetch(req).then(function(resp){
    if(resp && resp.ok){var cl=resp.clone();caches.open(cn).then(function(c){c.put(req,cl)})}
    return resp;
  }).catch(function(){
    return caches.match(req).then(function(c){return c||caches.match('/offline.html')||caches.match('/')});
  });
}

self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING'){self.skipWaiting()}
});
