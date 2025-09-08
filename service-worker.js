// Flight Timer & Log — Service Worker v1.12
const CACHE_NAME = "ftl-cache-v1.12";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Ensure the worker becomes active on first install so the app is immediately
  // available offline.
  if (!self.registration.active) {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Serve the application shell for navigation requests so the interface
  // continues to function offline.
  if (req.mode === "navigate") {
    event.respondWith(
      caches
        .match("./index.html")
        .then((cached) => cached || fetch(req))
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Only handle GET requests for other resources.
  if (req.method !== "GET") return;

  // Use a cache-first strategy. If the resource is in the cache, serve it
  // immediately. Otherwise fetch from the network and cache the response for
  // future offline use. If both fail, fall back to the app shell.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
