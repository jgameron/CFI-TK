// Flight Timer & Log — Service Worker v1.14
const CACHE_NAME = "ftl-cache-v1.14";
const APP_SHELL_URL = new URL("./index.html", self.location).toString();
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
  self.skipWaiting();
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

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate" || (req.method === "GET" && req.headers.get("accept")?.includes("text/html"))) {
    event.respondWith(
      caches.match(APP_SHELL_URL).then((cached) => {
        if (cached) {
          event.waitUntil(
            fetch(req)
              .then((res) => {
                if (!res || res.status !== 200) return;
                const copy = res.clone();
                return caches
                  .open(CACHE_NAME)
                  .then((cache) => cache.put(APP_SHELL_URL, copy));
              })
              .catch(() => null)
          );
          return cached;
        }
        return fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL_URL, copy));
            }
            return res;
          })
          .catch(() => caches.match(APP_SHELL_URL));
      })
    );
    return;
  }

  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (!res || res.status !== 200 || res.type === "opaque") return res;
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(APP_SHELL_URL));
    })
  );
});
