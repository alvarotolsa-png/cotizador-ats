const CACHE_NAME = "cotizador-ats-v1";
const BASE = "https://alvarotolsa-png.github.io/cotizador-ats/";
const ASSETS = [
  BASE + "Cotizador_index.html",
  BASE + "manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((r) => {
        if (!r || r.status !== 200 || r.type === "opaque") return r;
        const clone = r.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(BASE + "Cotizador_index.html"));
    })
  );
});
