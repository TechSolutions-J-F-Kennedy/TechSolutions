// frontend/js/main.js o frontend/js/app.js

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registrado correctamente con scope:', reg.scope))
      .catch((err) => console.error('Error al registrar Service Worker:', err));
  });
}

// ... resto de tu código JS