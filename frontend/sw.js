const CACHE_NAME = 'kennedy-tech-v1';

// Rutas directas basadas en el Service Worker ubicado en la raíz del proyecto
const APP_SHELL = [
  './',
  './frontend/css/base-dos.css',
  './frontend/css/mensajes-styles.css',
  './frontend/css/tema.css',
  './frontend/js/tema.js',
  './frontend/img/icono-192.png',
  './frontend/img/icono-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Intenta precargar cada recurso sin bloquear el registro si alguno cambia de nombre o falta
        return Promise.allSettled(
          APP_SHELL.map(url => cache.add(url).catch(err => console.warn(`[SW] No se pudo precargar: ${url}`, err)))
        );
      })
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

  // Excluir API o métodos distintos a GET
  if (pedido.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  evento.respondWith(
    fetch(pedido)
      .then((respuesta) => {
        if (respuesta.status === 200) {
          const copia = respuesta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(pedido, copia));
        }
        return respuesta;
      })
      .catch(() => caches.match(pedido))
  );
});