// Cotizador ATS — Service Worker
const CACHE_NAME = "cotizador-ats-v2";
const BASE = "https://alvarotolsa-png.github.io/cotizador-ats/";

const ASSETS = [
  BASE + "Cotizador_index.html",
  BASE + "manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting(); // ← activa inmediatamente sin esperar
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // ← toma control de todas las pestañas abiertas
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  // Para los archivos propios: red primero, caché como respaldo
  const url = e.request.url;
  const isOwn = url.startsWith(BASE) || url.includes("manifest.json") || url.includes("sw.js");

  if (isOwn) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          if (r && r.status === 200) {
            const clone = r.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Para recursos externos (SheetJS, etc): caché primero
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
  }
});
