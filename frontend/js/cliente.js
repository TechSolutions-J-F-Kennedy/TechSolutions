"use strict";

/* ══════════════════════════════════════════════════
   cliente.js — Lógica completa del panel del cliente
   - Carga pedidos y servicios del backend
   - Timeline de 5 estados en tiempo real (SSE)
   - Modal de calificación con estrellas
   - Cancelar solicitud antes de que la tome un técnico
══════════════════════════════════════════════════ */

const API =
  location.protocol === "file:" || location.port === "5500"
    ? "http://localhost:3000"
    : "";

/* ── Sesión (con fallback demo para que no te expulse) ── */
let usuarioRaw = localStorage.getItem("usuario");
if (!usuarioRaw) {
  const usuarioDemo = { id: 1, nombre: "Cliente Demo", nombre_real: "Cliente", apellido: "Demo", rol: "usuario", email: "demo@kennedy.com" };
  localStorage.setItem("usuario", JSON.stringify(usuarioDemo));
  usuarioRaw = JSON.stringify(usuarioDemo);
}
const usuario = JSON.parse(usuarioRaw);

/* ── DOM ── */
const elNombre        = document.getElementById("nombre-cliente");
const elAv            = document.getElementById("av-iniciales");
const elMsgGlobal     = document.getElementById("msg-global");
const elListaSol      = document.getElementById("lista-solicitudes");
const elListaSer      = document.getElementById("lista-servicios");
const elChipSol       = document.getElementById("chip-solicitudes");
const elChipSer       = document.getElementById("chip-servicios");
const elModalResena   = document.getElementById("modal-resena");
const elModalTecnico  = document.getElementById("modal-tecnico-nombre");
const elEstrellas     = document.querySelectorAll(".estrella-btn");
const elComentario    = document.getElementById("comentario-resena");
const elBtnCancelarR  = document.getElementById("btn-cancelar-resena");
const elBtnEnviarR    = document.getElementById("btn-enviar-resena");
const elToast         = document.getElementById("toast");

/* ── Estado local ── */
let estrellasSelec = 0;
let servicioParaCalif = null; // { id, tecnico, tecnico_id }
let toastTimer = null;

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function mostrarError(txt) {
  elMsgGlobal.textContent = txt;
  elMsgGlobal.hidden = false;
}

function mostrarToast(txt, ms = 3500) {
  if (toastTimer) clearTimeout(toastTimer);
  elToast.textContent = txt;
  elToast.classList.remove("hidden");
  toastTimer = setTimeout(() => elToast.classList.add("hidden"), ms);
}

function iniciales(nombre = "") {
  return nombre.trim().split(" ").slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "?";
}

function fechaCorta(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

/* ── Estado → badge ── */
const BADGE_CLASS = {
  solicitado: "badge--solicitado",
  asignado:   "badge--asignado",
  pendiente:  "badge--pendiente",
  yendo:      "badge--en_camino",
  "en proceso": "badge--en_sitio",
  finalizado: "badge--finalizado",
  cancelado:  "badge--cancelado",
};
const BADGE_LABEL = {
  solicitado:   "⏳ Solicitado",
  asignado:     "✅ Asignado",
  pendiente:    "🟣 Pendiente",
  yendo:        "🚗 En camino",
  "en proceso": "🔧 En sitio",
  finalizado:   "✔️ Finalizado",
  cancelado:    "✖ Cancelado",
};
function badge(estado = "") {
  const k = estado.toLowerCase();
  return `<span class="badge ${BADGE_CLASS[k] || ""}">${BADGE_LABEL[k] || estado}</span>`;
}

/* ── Timeline de 5 pasos ── */
const PASOS = [
  { key: "solicitado",   lbl: "Solicitado" },
  { key: "asignado",     lbl: "Asignado" },
  { key: "yendo",        lbl: "En camino" },
  { key: "en proceso",   lbl: "En sitio" },
  { key: "finalizado",   lbl: "Finalizado" },
];
function timeline(estadoActual = "") {
  const ea = estadoActual.toLowerCase();
  if (ea === "cancelado") return `<p style="font-size:12px;color:var(--err)">❌ Solicitud cancelada</p>`;
  const idx = PASOS.findIndex(p => p.key === ea);
  return `<div class="timeline">${PASOS.map((p, i) => {
    const cls = i < idx ? "hecho" : i === idx ? "activo" : "";
    const dot = i < idx ? "✓" : "";
    return `<div class="tl-step ${cls}"><div class="tl-dot">${dot}</div><span class="tl-label">${p.lbl}</span></div>`;
  }).join("")}</div>`;
}

/* ══════════════════════════════════
   RENDERIZADO
══════════════════════════════════ */
function renderSolicitudes(solicitudes) {
  elChipSol.textContent = solicitudes.length;
  if (!solicitudes.length) {
    elListaSol.innerHTML = `
      <div class="empty">
        <div class="empty__icon">📭</div>
        <p class="empty__titulo">Sin solicitudes activas</p>
        <p>Cuando hagas un pedido aparecerá acá.</p>
      </div>`;
    return;
  }
  elListaSol.innerHTML = solicitudes.map(s => `
    <div class="card" id="sol-${s.id}">
      <div class="card__head">
        <p class="card__desc">${escHtml(s.descripcion)}</p>
        ${badge(s.estado)}
      </div>
      <div class="card__meta">
        <span><i data-lucide="map-pin"></i>${escHtml(s.direccion || "")}</span>
        <span><i data-lucide="clock"></i>${fechaCorta(s.fecha)}</span>
      </div>
      <div class="card__actions">
        <button class="btn-sm btn-sm--danger" onclick="cancelarSolicitud(${s.id}, this)">
          <i data-lucide="x-circle"></i> Cancelar
        </button>
      </div>
    </div>
  `).join("");
  lucide.createIcons();
}

function renderServicios(servicios) {
  elChipSer.textContent = servicios.length;
  if (!servicios.length) {
    elListaSer.innerHTML = `
      <div class="empty">
        <div class="empty__icon">📋</div>
        <p class="empty__titulo">Sin servicios todavía</p>
        <p>Acá verás el historial de trabajos realizados.</p>
      </div>`;
    return;
  }
  elListaSer.innerHTML = servicios.map(s => {
    const estado = (s.Estado || s.estado || "").toLowerCase();
    const puedeCal = estado === "finalizado" && !s.mi_estrella;
    const tecNombre = s.tecnico || "Técnico asignado";
    return `
    <div class="card" id="ser-${s.id}">
      <div class="card__head">
        <p class="card__desc">${escHtml(s.descripcion || "")}</p>
        ${badge(estado)}
      </div>
      ${timeline(estado)}
      <div class="card__meta">
        <span><i data-lucide="user"></i>${escHtml(tecNombre)}</span>
        <span><i data-lucide="map-pin"></i>${escHtml(s.direccion || "")}</span>
        <span><i data-lucide="calendar"></i>${fechaCorta(s.fecha_creacion)}</span>
        ${s.mi_estrella ? `<span><i data-lucide="star"></i>Tu calificación: ${s.mi_estrella}★</span>` : ""}
      </div>
      ${puedeCal ? `
      <div class="card__actions">
        <button class="btn-sm btn-sm--primary"
          onclick="abrirModalResena(${s.id}, '${escAttr(tecNombre)}', ${s.tecnico_id})">
          <i data-lucide="star"></i> Calificar
        </button>
      </div>` : ""}
    </div>`;
  }).join("");
  lucide.createIcons();
}

/* ── Escape helpers ── */
function escHtml(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function escAttr(str) {
  return String(str || "").replace(/'/g,"\\'");
}

/* ══════════════════════════════════
   CARGAR DATOS
══════════════════════════════════ */
async function cargarPedidos() {
  try {
    const res = await fetch(`${API}/api/clientes/${usuario.id}/pedidos`);
    if (!res.ok) throw new Error(await res.text());
    const { payload } = await res.json();
    renderSolicitudes(payload.solicitudes || []);
    renderServicios(payload.servicios || []);
  } catch (err) {
    console.error(err);
    mostrarError("No se pudieron cargar los datos. Verificá que el backend esté activo.");
    elListaSol.innerHTML = "";
    elListaSer.innerHTML = "";
  }
}

/* ══════════════════════════════════
   CANCELAR SOLICITUD
══════════════════════════════════ */
window.cancelarSolicitud = async function(solicitudId, btn) {
  if (!confirm("¿Seguro que querés cancelar esta solicitud?")) return;
  btn.disabled = true;
  btn.textContent = "Cancelando...";
  try {
    const res = await fetch(`${API}/api/clientes/${usuario.id}/solicitudes/${solicitudId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json();
      mostrarToast("⚠️ " + (d.error || "No se pudo cancelar"));
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="x-circle"></i> Cancelar';
      lucide.createIcons();
      return;
    }
    // Eliminar la tarjeta del DOM con animación
    const card = document.getElementById(`sol-${solicitudId}`);
    if (card) {
      card.style.opacity = "0";
      card.style.transition = "opacity .3s";
      setTimeout(() => { card.remove(); actualizarChipSolicitudes(); }, 300);
    }
    mostrarToast("✅ Solicitud cancelada correctamente");
  } catch {
    mostrarToast("❌ Error al conectar con el servidor");
    btn.disabled = false;
  }
};

function actualizarChipSolicitudes() {
  const cant = document.querySelectorAll("[id^='sol-']").length;
  elChipSol.textContent = cant;
  if (cant === 0) {
    elListaSol.innerHTML = `
      <div class="empty">
        <div class="empty__icon">📭</div>
        <p class="empty__titulo">Sin solicitudes activas</p>
        <p>Cuando hagas un pedido aparecerá acá.</p>
      </div>`;
  }
}

/* ══════════════════════════════════
   MODAL DE CALIFICACIÓN
══════════════════════════════════ */
window.abrirModalResena = function(servicioId, tecnico, tecnicoId) {
  servicioParaCalif = { id: servicioId, tecnico, tecnico_id: tecnicoId };
  estrellasSelec = 0;
  elComentario.value = "";
  elEstrellas.forEach(b => b.classList.remove("activa"));
  elModalTecnico.textContent = `¿Cómo fue la atención de ${tecnico}?`;
  elModalResena.classList.remove("hidden");
};

elEstrellas.forEach(btn => {
  btn.addEventListener("click", () => {
    estrellasSelec = Number(btn.dataset.val);
    elEstrellas.forEach(b => b.classList.toggle("activa", Number(b.dataset.val) <= estrellasSelec));
  });
});

elBtnCancelarR.addEventListener("click", () => elModalResena.classList.add("hidden"));
elModalResena.addEventListener("click", e => {
  if (e.target === elModalResena) elModalResena.classList.add("hidden");
});

elBtnEnviarR.addEventListener("click", async () => {
  if (!estrellasSelec) { mostrarToast("Seleccioná al menos 1 estrella ⭐"); return; }
  elBtnEnviarR.disabled = true;
  elBtnEnviarR.textContent = "Enviando...";
  try {
    const res = await fetch(`${API}/api/clientes/${usuario.id}/resenas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicio_id: servicioParaCalif.id,
        estrella: estrellasSelec,
        comentario: elComentario.value.trim() || null,
      }),
    });
    const d = await res.json();
    if (!res.ok) { mostrarToast("⚠️ " + (d.error || "No se pudo enviar")); return; }

    elModalResena.classList.add("hidden");
    mostrarToast(`✅ ¡Gracias por calificar con ${estrellasSelec}★!`);

    // Actualizar la tarjeta del servicio sin recargar
    const card = document.getElementById(`ser-${servicioParaCalif.id}`);
    if (card) {
      const actions = card.querySelector(".card__actions");
      if (actions) actions.remove();
      const meta = card.querySelector(".card__meta");
      if (meta) {
        const sp = document.createElement("span");
        sp.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Tu calificación: ${estrellasSelec}★`;
        meta.appendChild(sp);
      }
    }
  } catch { mostrarToast("❌ Error al conectar con el servidor"); }
  finally { elBtnEnviarR.disabled = false; elBtnEnviarR.textContent = "Enviar calificación"; }
});

/* ══════════════════════════════════
   SSE — SEGUIMIENTO EN TIEMPO REAL
══════════════════════════════════ */
function conectarSSE() {
  const url = `${API}/api/chat/${usuario.id}/tiempo-real`;
  const es = new EventSource(url);

  es.addEventListener("estado-actualizado", (e) => {
    const { servicioId, estado } = JSON.parse(e.data);
    // Actualizar el badge y el timeline en la tarjeta del servicio
    const card = document.getElementById(`ser-${servicioId}`);
    if (!card) { cargarPedidos(); return; } // Si no está en DOM, recargamos todo
    const badgeEl = card.querySelector(".badge");
    if (badgeEl) badgeEl.outerHTML = badge(estado);
    const tlEl = card.querySelector(".timeline");
    const tl = timeline(estado);
    if (tlEl) tlEl.outerHTML = tl;
    else card.querySelector(".card__head").insertAdjacentHTML("afterend", tl);
    // Si finalizó, mostrar botón de calificación
    if (estado === "finalizado") {
      const tecNombre = card.querySelector(".card__meta span")?.textContent?.trim() || "el técnico";
      if (!card.querySelector(".card__actions")) {
        card.insertAdjacentHTML("beforeend", `
          <div class="card__actions">
            <button class="btn-sm btn-sm--primary"
              onclick="abrirModalResena(${servicioId}, '${escAttr(tecNombre)}', 0)">
              <i data-lucide="star"></i> Calificar
            </button>
          </div>`);
        lucide.createIcons();
      }
    }
    mostrarToast(`🔔 Tu servicio pasó a: ${BADGE_LABEL[estado.toLowerCase()] || estado}`);
  });

  es.addEventListener("solicitud-tomada", () => {
    cargarPedidos(); // Recargar cuando un técnico acepta
    mostrarToast("✅ ¡Un técnico aceptó tu solicitud!");
  });

  es.onerror = () => {
    es.close();
    // Reintentar en 10 s
    setTimeout(conectarSSE, 10000);
  };
}

/* ══════════════════════════════════
   INICIALIZAR
══════════════════════════════════ */
(function init() {
  // Mostrar datos del usuario
  const nombre = usuario.nombre_real
    ? `${usuario.nombre_real} ${usuario.apellido || ""}`.trim()
    : usuario.nombre || "Cliente";
  elNombre.textContent = nombre;
  elAv.textContent = iniciales(nombre);

  // Cargar datos
  cargarPedidos();

  // Conectar SSE para actualizaciones en tiempo real
  conectarSSE();
})();
