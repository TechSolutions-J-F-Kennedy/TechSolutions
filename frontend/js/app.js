const $ = (s) => document.querySelector(s);
const L = localStorage;

const ESTADOS = ['Pendiente', 'Yendo', 'En proceso', 'Finalizado'];
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

const user = () => L.user || 'Pepe';
const estado = () => L.estado || 'Pendiente';
const CLS = {
  Pendiente: 'pending',
  Yendo: 'progress',
  'En proceso': 'progress',
  Finalizado: 'success'
};
const st = (e) => `<span class="status ${CLS[e]}">${e}</span>`;
const NT = ['pendientes', 'herramientas', 'inicio', 'perfil', 'chat'];

function navFx(f, t, p, anim) {
  const n = document.querySelector('nav');
  if (!n) return;

  const A = n.querySelectorAll('a');
  const ind = n.querySelector('.ind');
  const nr = n.getBoundingClientRect();

  const c = (k) => {
    const r = A[k].getBoundingClientRect();
    return r.left - nr.left + r.width / 2;
  };

  ind.style.transition = anim ? 'transform .3s cubic-bezier(.22,.8,.3,1)' : 'none';
  ind.style.transform = `translateX(${c(f) + (c(t) - c(f)) * p - 13}px)`;

  A.forEach((a, k) => {
    const w = k == f ? 1 - p : k == t ? p : 0;
    const v = a.querySelector('svg');

    a.style.transition = anim ? 'color .3s' : 'none';
    a.style.color = `color-mix(in srgb,#1D4ED8 ${w * 100}%,#94A3B8)`;

    if (v) {
      v.style.transition = anim ? 'transform .3s' : 'none';
      v.style.transform = `scale(${1 + 0.18 * w})`;
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

const pg = (u) => ((u || location.pathname).split('/').pop().replace('.html', '')) || 'index';
const cur = ORDER[pg()];

if (!L.user && pg() != 'index') location.href = 'index.html';

const EMB = location.search.includes('e=1');
const HT = document.documentElement;

if (EMB) HT.classList.add('embed');
if (sessionStorage.still) {
  HT.classList.add('still');
  sessionStorage.removeItem('still');
}

if (!EMB) {
  const prev = parseFloat(sessionStorage.idx);
  if (!isNaN(prev) && cur < prev) HT.classList.add('back');
  sessionStorage.idx = cur;
}

function go(u) {
  const a = document.querySelector('.app');
  a.style.animation = '';
  a.classList.add(ORDER[pg(u)] < cur ? 'outB' : 'outF');
  setTimeout(() => location.href = u, 240);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (a && a.getAttribute('href').endsWith('.html')) {
    e.preventDefault();
    go(a.getAttribute('href'));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('login')) {
    const l = [
      ['pendientes', 'clipboard-list', 'Tareas'],
      ['herramientas', 'wrench', 'Herram.'],
      ['inicio', 'house', 'Inicio'],
      ['perfil', 'user', 'Perfil'],
      ['chat', 'message-circle', 'Chat']
    ];
    const p = pg() == 'pedido_actual' ? 'inicio' : pg();
    document.body.insertAdjacentHTML(
      'beforeend',
      '<nav>' +
        l
          .map(
            (x) =>
              `<a href="${x[0]}.html" class="${x[0] == p ? 'on' : ''}"><i data-lucide="${x[1]}"></i>${x[2]}</a>`
          )
          .join('') +
        '<i class="ind"></i></nav>'
    );
  }

  if (window.lucide) lucide.createIcons();
  if (document.querySelector('nav')) {
    const k = NT.indexOf(pg() == 'pedido_actual' ? 'inicio' : pg());
    navFx(k, k, 0, false);
  }
});

/* ===== Gestos tipo celular ===== */
if (!EMB) {
  const dot = document.createElement('div');
  dot.className = 'finger';
  document.body.appendChild(dot);

  const fp = (e) => {
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
  };

  addEventListener('pointerdown', (e) => {
    if (e.pointerType == 'mouse') {
      fp(e);
      dot.classList.add('on');
    }
  });

  addEventListener('pointermove', (e) => {
    if (e.pointerType == 'mouse' && dot.classList.contains('on')) fp(e);
  });

  addEventListener('pointerup', () => dot.classList.remove('on'));

  if (!document.body.classList.contains('login')) {
    (function () {
      const T = ['pendientes', 'herramientas', 'inicio', 'perfil', 'chat'];
      const pd = pg() == 'pedido_actual';
      const i = T.indexOf(pd ? 'inicio' : pg());
      const nbr = (d) => (pd ? (d > 0 ? 'inicio' : null) : T[i - d] || null);
      const app = $('.app');
      const S = [app, ...document.querySelectorAll('.bar')];
      const fr = {};
      const W = () => innerWidth;

      const mk = (n) => {
        if (!n || fr[n]) return;
        const f = document.createElement('iframe');
        f.src = n + '.html?e=1';
        f.className = 'peek';
        f.tabIndex = -1;
        document.body.appendChild(f);
        fr[n] = f;
      };

      setTimeout(() => {
        mk(nbr(1));
        mk(nbr(-1));
      }, 500);

      let sx, sy, dx = 0, on = 0, drag = 0, vx = 0, lx, lt, dragged = 0;

      addEventListener('click', (e) => {
        if (dragged) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);

      addEventListener('pointerdown', (e) => {
        if (e.button > 0 || e.target.closest('input,textarea,.panel') || $('.sheet.on,.conv.on')) return;
        on = 1;
        drag = 0;
        sx = lx = e.clientX;
        sy = e.clientY;
        lt = performance.now();
        vx = 0;
        dx = 0;
      });

      addEventListener('pointermove', (e) => {
        if (!on) return;

        const x = e.clientX - sx;
        const y = e.clientY - sy;

        if (!drag) {
          if (Math.abs(x) < 8 && Math.abs(y) < 8) return;
          if (Math.abs(y) > Math.abs(x)) {
            on = 0;
            return;
          }
          drag = 1;
          S.forEach((el) => {
            el.style.animation = 'none';
            el.style.transition = 'none';
          });
        }

        const n = performance.now();
        vx = (e.clientX - lx) / (n - lt || 1);
        lx = e.clientX;
        lt = n;
        dx = x;

        const d = x > 0 ? 1 : -1;
        const nb = nbr(d);
        const X = nb ? x : x * 0.3;

        S.forEach((el) => {
          el.style.transform = `translateX(${X}px)`;
        });

        navFx(i, nb ? T.indexOf(nb) : i, nb ? Math.min(1, Math.abs(X) / W()) : 0, false);

        Object.keys(fr).forEach((k) => {
          const f = fr[k];
          f.style.transition = 'none';
          f.style.visibility = k == nb ? 'visible' : 'hidden';
          if (k == nb) f.style.transform = `translateX(${X - d * W()}px)`;
        });

        if (nb && !fr[nb]) mk(nb);
      });

      function end() {
        if (!on) return;
        on = 0;
        if (!drag) return;

        drag = 0;
        dragged = 1;
        setTimeout(() => (dragged = 0), 60);

        const d = dx > 0 ? 1 : -1;
        const nb = nbr(d);
        const ok = nb && (Math.abs(dx) > W() * 0.3 || (Math.abs(vx) > 0.5 && Math.sign(vx) == d));
        const tr = 'transform .3s cubic-bezier(.22,.8,.3,1)';

        S.forEach((el) => {
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
          setTimeout(() => {
            sessionStorage.idx = ORDER[nb];
            sessionStorage.still = 1;
            location.href = nb + '.html';
          }, 300);
        } else {
          setTimeout(() => Object.values(fr).forEach((f) => (f.style.visibility = 'hidden')), 300);
        }
      }

      addEventListener('pointerup', end);
      addEventListener('pointercancel', end);
    })();
  }
}
