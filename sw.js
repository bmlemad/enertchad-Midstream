/* ═══ EnerTchad Service Worker v1.0 ═══
 * Cache-first for static assets, network-first for HTML.
 * Drop this file at the root of each filiale site.
 * Register via: navigator.serviceWorker.register('/sw.js')
 */
var CACHE_NAME = 'enertchad-v1';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/css/main.v1.css'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME })
             .map(function(n) { return caches.delete(n) })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // Network-first for HTML (always fresh content)
  if (req.headers.get('Accept') && req.headers.get('Accept').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone) });
        return res;
      }).catch(function() {
        return caches.match(req);
      })
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone) });
        }
        return res;
      });
    })
  );
});
