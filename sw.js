// Sube este número cada vez que publiques cambios en index.html (o cualquier
// archivo del app shell). Así el navegador detecta la actualización y refresca
// el caché de todos los usuarios automáticamente.
const CACHE_VERSION = "2026-06-30-01";
const CACHE_NAME = `cotizador-ats-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isHTML =
    event.request.mode === "navigate" ||
    event.request.destination === "document";

  if (isHTML) {
    // Red primero: siempre intenta traer la versión más reciente de index.html.
    // Si no hay conexión, cae de regreso a la última copia guardada.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copy))
            .catch(() => {});
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Caché primero para el resto (íconos, manifest, librerías): más rápido,
  // y se refresca solo cuando se publica una nueva CACHE_VERSION.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, copy))
          .catch(() => {});
        return response;
      });
    })
  );
});
