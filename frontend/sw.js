// Service worker: hace que la app se pueda instalar y que abra aunque se corte internet.
// Siempre intenta traer la versión nueva de la red; si no hay conexión, usa la guardada.
const CACHE = 'kennedy-tech-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (evento) => {
    const pedido = evento.request;
    const url = new URL(pedido.url);

    // Los datos (/api) siempre van directo al servidor, nunca se guardan
    if (pedido.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

    evento.respondWith(
        fetch(pedido)
            .then((respuesta) => {
                const copia = respuesta.clone();
                caches.open(CACHE).then((cache) => cache.put(pedido, copia));
                return respuesta;
            })
            .catch(() => caches.match(pedido))
    );
});
