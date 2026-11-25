/* ==========================================================================
   tema.js — Modo oscuro + hoja de Configuración
   Poner en el <head> de TODAS las páginas (sin defer), para que el tema se
   aplique antes de pintar y no haya parpadeo blanco.
   ========================================================================== */
(function () {
  var CLAVE = 'tema'; // localStorage: 'dark' | 'light' (si no existe, se usa el del dispositivo)
  var raiz = document.documentElement;

  function guardado() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }

  function delSistema() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function actual() {
    var g = guardado();
    return g === 'dark' || g === 'light' ? g : delSistema();
  }

  function aplicar(tema) {
    raiz.setAttribute('data-theme', tema);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = tema === 'dark' ? '#0b1220' : '#f8fafc';
  }

  function fijar(tema) {
    try { localStorage.setItem(CLAVE, tema); } catch (e) {}
    aplicar(tema);
  }

  function usarDelSistema() {
    try { localStorage.removeItem(CLAVE); } catch (e) {}
    aplicar(delSistema());
  }

  aplicar(actual());

  // Si el usuario no eligió nada, seguir los cambios del dispositivo
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var alCambiar = function () { if (!guardado()) aplicar(delSistema()); };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar);
  }

  window.Tema = { actual: actual, fijar: fijar, usarDelSistema: usarDelSistema };

  /* ---------------- Hoja de Configuración ---------------- */
  function crearHoja() {
    var overlay = document.createElement('div');
    overlay.className = 'ajustes-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="ajustes-sheet" role="dialog" aria-modal="true" aria-labelledby="ajustes-titulo">' +
        '<div class="grab"></div>' +
        '<div class="ajustes-head">' +
          '<h4 id="ajustes-titulo">Configuración</h4>' +
          '<button type="button" class="ajustes-close" aria-label="Cerrar"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<div class="ajustes-row">' +
          '<div class="ajustes-icon"><i data-lucide="moon"></i></div>' +
          '<div class="ajustes-text"><strong>Modo oscuro</strong><small>Más cómodo para la vista de noche</small></div>' +
          '<button type="button" class="ajustes-switch" role="switch" aria-checked="false" aria-label="Modo oscuro"></button>' +
        '</div>' +
        '<button type="button" class="ajustes-auto">Usar el modo del dispositivo</button>' +
      '</div>';
    document.body.appendChild(overlay);

    var interruptor = overlay.querySelector('.ajustes-switch');

    function sincronizar() {
      interruptor.setAttribute('aria-checked', String(actual() === 'dark'));
    }

    function abrir() {
      // cerrar el menú lateral si estaba abierto
      var d = document.getElementById('side-drawer');
      var o = document.getElementById('drawer-overlay');
      if (d) d.classList.remove('active', 'open');
      if (o) o.classList.remove('active', 'open');

      sincronizar();
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      interruptor.focus();
    }

    function cerrar() {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }

    interruptor.addEventListener('click', function () {
      fijar(actual() === 'dark' ? 'light' : 'dark');
      sincronizar();
    });

    overlay.querySelector('.ajustes-auto').addEventListener('click', function () {
      usarDelSistema();
      sincronizar();
    });

    overlay.querySelector('.ajustes-close').addEventListener('click', cerrar);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });

    // Qué botones abren la configuración:
    //  - cualquier elemento con data-abrir-ajustes
    //  - el botón de engranaje del header (aria-label="Ajustes")
    //  - el ítem "Configuración" del menú lateral
    var disparadores = Array.prototype.slice.call(
      document.querySelectorAll('[data-abrir-ajustes], [aria-label="Ajustes"]')
    );
    Array.prototype.forEach.call(document.querySelectorAll('.drawer-item'), function (el) {
      if (/configuraci/i.test(el.textContent)) disparadores.push(el);
    });

    disparadores.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        abrir();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearHoja);
  } else {
    crearHoja();
  }
})();
