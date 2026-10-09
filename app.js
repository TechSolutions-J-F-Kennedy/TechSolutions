function $(selector) {
  return document.querySelector(selector);
}

const L = localStorage;

const ESTADOS = [
  'Pendiente',
  'Yendo',
  'En proceso',
  'Finalizado'
];

const PEDIDO = {
  id: '#1042',
  servicio: 'Reparación de PC',
  cliente: 'Juan Pérez',
  telefono: '+598 99 123 456',
  ubicacion: 'Av. Brasil 1234, Montevideo',
  horario: '14:00 - 16:00',
  materiales: 'Cables, cinta aislante, tester, fuente 12V',
  detalle: 'La PC no enciende luego de un corte de luz. Revisar fuente y placa madre.'
};

const OTRAS = [
  { t: 'Revisión de tablero · Sra. López', e: 'Pendiente' },
  { t: 'Instalación de luminarias · Taller Sur', e: 'Pendiente' },
  { t: 'Cambio de llave térmica · Ruiz', e: 'Finalizado' }
];

function user() {
  return L.user || 'Pepe';
}

function estado() {
  return L.estado || 'Pendiente';
}

const CLS = {
  'Pendiente': 'pending',
  'Yendo': 'progress',
  'En proceso': 'progress',
  'Finalizado': 'success'
};

function st(e) {
  return `<span class="status ${CLS[e]}">${e}</span>`;
}

const NT = [
  'pendientes',
  'herramientas',
  'inicio',
  'perfil',
  'chat'
];

function navFx(from, to, progress, animate) {
  const nav = document.querySelector('nav');

  if (!nav) {
    return;
  }

  const links = nav.querySelectorAll('a');
  const indicator = nav.querySelector('.ind');
  const navRect = nav.getBoundingClientRect();

  function center(index) {
    const rect = links[index].getBoundingClientRect();
    return rect.left - navRect.left + rect.width / 2;
  }

  indicator.style.transition = animate ? 'transform .3s cubic-bezier(.22,.8,.3,1)' : 'none';
  indicator.style.transform = `translateX(${center(from) + (center(to) - center(from)) * progress - 13}px)`;

  links.forEach(function (link, index) {
    let weight = 0;

    if (index == from) {
      weight = 1 - progress;
    } else if (index == to) {
      weight = progress;
    }

    const svg = link.querySelector('svg');

    link.style.transition = animate ? 'color .3s' : 'none';
    link.style.color = `color-mix(in srgb,#1D4ED8 ${weight * 100}%,#94A3B8)`;

    if (svg) {
      svg.style.transition = animate ? 'transform .3s' : 'none';
      svg.style.transform = `scale(${1 + .18 * weight})`;
    }
  });
}

const ORDER = {
  index: -1,
  pendientes: 0,
  herramientas: 1,
  inicio: 2,
  pedido_actual: 2.5,
  perfil: 3,
  chat: 4
};

function pg(url) {
  return ((url || location.pathname).split('/').pop().replace('.html', '')) || 'index';
}

const cur = ORDER[pg()];

if (!L.user && pg() != 'index') {
  location.href = 'index.html';
}

const EMB = location.search.includes('e=1');
const HT = document.documentElement;

if (EMB) {
  HT.classList.add('embed');
}

if (sessionStorage.still) {
  HT.classList.add('still');
  sessionStorage.removeItem('still');
}

if (!EMB) {
  const prev = parseFloat(sessionStorage.idx);

  if (!isNaN(prev) && cur < prev) {
    HT.classList.add('back');
  }

  sessionStorage.idx = cur;
}

function go(url) {
  const app = document.querySelector('.app');

  app.style.animation = '';
  app.classList.add(ORDER[pg(url)] < cur ? 'outB' : 'outF');

  setTimeout(function () {
    location.href = url;
  }, 240);
}

document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href]');

  if (link && link.getAttribute('href').endsWith('.html')) {
    e.preventDefault();
    go(link.getAttribute('href'));
  }
});

document.addEventListener('DOMContentLoaded', function () {
  if (!document.body.classList.contains('login')) {
    const items = [
      ['pendientes', 'clipboard-list', 'Tareas'],
      ['herramientas', 'wrench', 'Herram.'],
      ['inicio', 'house', 'Inicio'],
      ['perfil', 'user', 'Perfil'],
      ['chat', 'message-circle', 'Chat']
    ];
    const active = pg() == 'pedido_actual' ? 'inicio' : pg();

    document.body.insertAdjacentHTML(
      'beforeend',
      '<nav>' + items.map(function (x) {
        return `<a href="${x[0]}.html" class="${x[0] == active ? 'on' : ''}"><i data-lucide="${x[1]}"></i>${x[2]}</a>`;
      }).join('') + '<i class="ind"></i></nav>'
    );
  }

  if (window.lucide) {
    lucide.createIcons();
  }

  if (document.querySelector('nav')) {
    const index = NT.indexOf(pg() == 'pedido_actual' ? 'inicio' : pg());
    navFx(index, index, 0, false);
  }
});

/* ===== Gestos tipo celular ===== */
if (!EMB) {
  const dot = document.createElement('div');

  dot.className = 'finger';
  document.body.appendChild(dot);

  function fingerPosition(e) {
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
  }

  addEventListener('pointerdown', function (e) {
    if (e.pointerType == 'mouse') {
      fingerPosition(e);
      dot.classList.add('on');
    }
  });

  addEventListener('pointermove', function (e) {
    if (e.pointerType == 'mouse' && dot.classList.contains('on')) {
      fingerPosition(e);
    }
  });

  addEventListener('pointerup', function () {
    dot.classList.remove('on');
  });

  if (!document.body.classList.contains('login')) {
    (function () {
      const T = [
        'pendientes',
        'herramientas',
        'inicio',
        'perfil',
        'chat'
      ];
      const pd = pg() == 'pedido_actual';
      const i = T.indexOf(pd ? 'inicio' : pg());

      function nbr(d) {
        if (pd) {
          return d > 0 ? 'inicio' : null;
        }

        return T[i - d] || null;
      }

      const app = $('.app');
      const S = [app, ...document.querySelectorAll('.bar')];
      const fr = {};

      function W() {
        return innerWidth;
      }

      function mk(name) {
        if (!name || fr[name]) {
          return;
        }

        const frame = document.createElement('iframe');

        frame.src = name + '.html?e=1';
        frame.className = 'peek';
        frame.tabIndex = -1;
        document.body.appendChild(frame);
        fr[name] = frame;
      }

      setTimeout(function () {
        mk(nbr(1));
        mk(nbr(-1));
      }, 500);

      let sx;
      let sy;
      let dx = 0;
      let on = 0;
      let drag = 0;
      let vx = 0;
      let lx;
      let lt;
      let dragged = 0;

      addEventListener('click', function (e) {
        if (dragged) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);

      addEventListener('pointerdown', function (e) {
        if (e.button > 0 || e.target.closest('input,textarea,.panel') || $('.sheet.on,.conv.on')) {
          return;
        }

        on = 1;
        drag = 0;
        sx = e.clientX;
        lx = e.clientX;
        sy = e.clientY;
        lt = performance.now();
        vx = 0;
        dx = 0;
      });

      addEventListener('pointermove', function (e) {
        if (!on) {
          return;
        }

        const x = e.clientX - sx;
        const y = e.clientY - sy;

        if (!drag) {
          if (Math.abs(x) < 8 && Math.abs(y) < 8) {
            return;
          }

          if (Math.abs(y) > Math.abs(x)) {
            on = 0;
            return;
          }

          drag = 1;

          S.forEach(function (el) {
            el.style.animation = 'none';
            el.style.transition = 'none';
          });
        }

        const now = performance.now();

        vx = (e.clientX - lx) / (now - lt || 1);
        lx = e.clientX;
        lt = now;
        dx = x;

        const d = x > 0 ? 1 : -1;
        const nb = nbr(d);
        const X = nb ? x : x * .3;

        S.forEach(function (el) {
          el.style.transform = `translateX(${X}px)`;
        });

        navFx(i, nb ? T.indexOf(nb) : i, nb ? Math.min(1, Math.abs(X) / W()) : 0, false);

        Object.keys(fr).forEach(function (k) {
          const f = fr[k];

          f.style.transition = 'none';
          f.style.visibility = k == nb ? 'visible' : 'hidden';

          if (k == nb) {
            f.style.transform = `translateX(${X - d * W()}px)`;
          }
        });

        if (nb && !fr[nb]) {
          mk(nb);
        }
      });

      function end() {
        if (!on) {
          return;
        }

        on = 0;

        if (!drag) {
          return;
        }

        drag = 0;
        dragged = 1;

        setTimeout(function () {
          dragged = 0;
        }, 60);

        const d = dx > 0 ? 1 : -1;
        const nb = nbr(d);
        const ok = nb && (Math.abs(dx) > W() * .3 || (Math.abs(vx) > .5 && Math.sign(vx) == d));
        const tr = 'transform .3s cubic-bezier(.22,.8,.3,1)';

        S.forEach(function (el) {
          el.style.transition = tr;
          el.style.transform = ok ? `translateX(${d * W()}px)` : 'translateX(0)';
        });

        const f = fr[nb];

        if (f) {
          f.style.transition = tr;
          f.style.transform = ok ? 'translateX(0)' : `translateX(${-d * W()}px)`;
        }

        navFx(ok ? T.indexOf(nb) : i, ok ? T.indexOf(nb) : i, 0, true);

        if (ok) {
          setTimeout(function () {
            sessionStorage.idx = ORDER[nb];
            sessionStorage.still = 1;
            location.href = nb + '.html';
          }, 300);
        } else {
          setTimeout(function () {
            Object.values(fr).forEach(function (frame) {
              frame.style.visibility = 'hidden';
            });
          }, 300);
        }
      }

      addEventListener('pointerup', end);
      addEventListener('pointercancel', end);
    })();
  }
}
