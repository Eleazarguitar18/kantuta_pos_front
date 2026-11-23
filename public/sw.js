/*
 * Fallback SPA para hosting estático (Render).
 * Render sirve "/" pero responde 404 a rutas profundas como /agentes o /signin.
 * Este service worker intercepta solo navegaciones del mismo origen: si el
 * servidor responde 404, entrega el index.html real sin cambiar la URL,
 * para que React Router resuelva la ruta con URLs limpias.
 */
const CACHE_NAME = "kantuta-spa-cache-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(["/", "/index.html"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo navegaciones del mismo origen; assets y peticiones API siguen normal.
  if (
    request.method !== "GET" ||
    request.mode !== "navigate" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok) return response;

        // El servidor no conoce la ruta del router: servimos el index vigente.
        const indexResponse = await fetch("/index.html", { cache: "reload" });
        if (indexResponse.ok) {
          const copy = indexResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/index.html", copy));
          return indexResponse;
        }
        return (await caches.match("/index.html")) || response;
      } catch {
        return (await caches.match("/index.html")) || Response.error();
      }
    })(),
  );
});
