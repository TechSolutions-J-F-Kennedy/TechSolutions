const CACHE_NAME = 'kennedy-tech-v1';

// Archivos básicos de la app para guardar en caché
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/styles.css', // Tu CSS principal
  '/js/app.js',
  '/img/icono-192.png',
  '/img/icono-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => {
      return Promise.all(
        claves.map((clave) => {
          if (clave !== CACHE_NAME) {
            return caches.delete(clave);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  const url = new URL(pedido.url);

  // Excluir peticiones de API o métodos que no sean GET
  if (pedido.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  evento.respondWith(
    fetch(pedido)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(pedido, copia));
        return respuesta;
      })
      .catch(() => caches.match(pedido))
  );
});