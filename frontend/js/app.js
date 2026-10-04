// ===== ESTADO GLOBAL =====
let currentOrderId = null;

// ===== INICIO =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tecnicoNombre").textContent = `¡Hola, ${TECNICO.nombre}! 👋`;
  document.getElementById("statusBadge").textContent = TECNICO.estado;

  renderOrders("todas");
  initChips();
  initNav();
  initFicha();
  initCheckin();
  initMateriales();
  initCheckout();

  lucide.createIcons();
});

// ===== NAVEGACIÓN ENTRE PANTALLAS =====
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const navBtn = document.querySelector(`.nav-item[data-screen="${id}"]`);
  if (navBtn) navBtn.classList.add("active");

  document.getElementById("btnBack").style.display = id === "screen-agenda" ? "none" : "flex";
  lucide.createIcons();
}

function initNav() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const target = item.dataset.screen;
      if (target !== "screen-agenda" && !currentOrderId) {
        alert("Primero seleccioná una orden desde la Agenda.");
        return;
      }
      showScreen(target);
    });
  });

  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.nav));
  });

  document.getElementById("btnBack").addEventListener("click", () => showScreen("screen-agenda"));
}

// ===== 1. AGENDA =====
function initChips() {
  document.querySelectorAll("#chipsFiltro .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#chipsFiltro .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderOrders(chip.dataset.filter);
    });
  });
}

function renderOrders(filter) {
  const list = document.getElementById("ordersList");
  const filtradas = filter === "todas" ? ORDENES : ORDENES.filter(o => o.estado === filter);

  document.getElementById("totalOrdenes").textContent = ORDENES.length;

  list.innerHTML = filtradas.map(o => `
    <div class="order-card" data-id="${o.id}">
      <div class="order-info">
        <strong>#${o.id} · ${o.cliente}</strong>
        <span>${o.direccion} · ${o.horario}</span>
      </div>
      <span class="status-pill status-${o.estado}">${labelEstado(o.estado)}</span>
    </div>
  `).join("") || `<p class="muted">No hay órdenes en este filtro.</p>`;

  list.querySelectorAll(".order-card").forEach(card => {
    card.addEventListener("click", () => openFicha(Number(card.dataset.id)));
  });
}

function labelEstado(estado) {
  return { pendiente: "Pendiente", "en-sitio": "En sitio", finalizado: "Finalizado" }[estado] || estado;
}

function getOrdenActual() {
  return ORDENES.find(o => o.id === currentOrderId);
}

// ===== 2. FICHA DE TRABAJO =====
function openFicha(id) {
  currentOrderId = id;
  renderFicha();
  showScreen("screen-ficha");
}

function initFicha() {
  document.getElementById("btnVerRuta").addEventListener("click", () => {
    const o = getOrdenActual();
    // TODO backend: reemplazar por integración real de mapas (Google Maps / Leaflet)
    alert(`Abriendo ruta hacia: ${o.direccion}`);
  });

  document.getElementById("btnIrCheckin").addEventListener("click", () => {
    renderCheckin();
    showScreen("screen-checkin");
  });
}

function renderFicha() {
  const o = getOrdenActual();
  document.getElementById("fichaCliente").textContent = o.cliente;
  document.getElementById("fichaDireccion").textContent = o.direccion;
  document.getElementById("fichaHorario").textContent = o.horario;
  document.getElementById("fichaDescripcion").textContent = o.descripcion;
}

// ===== 3. CHECK-IN GPS =====
function initCheckin() {
  const slider = document.getElementById("distanceSlider");

  slider.addEventListener("input", () => actualizarDistancia(Number(slider.value)));

  document.getElementById("btnUsarGpsReal").addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Este navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        document.getElementById("gpsPrecision").textContent = `${Math.round(pos.coords.accuracy)} m`;
        // TODO backend: calcular distancia real contra lat/lng del cliente (haversine)
        alert("Ubicación obtenida. La distancia real se calculará cuando el backend provea las coordenadas del cliente.");
      },
      err => alert("No se pudo obtener la ubicación: " + err.message)
    );
  });

  document.getElementById("btnCheckin").addEventListener("click", () => {
    const o = getOrdenActual();
    o.estado = "en-sitio";
    o.checkinTimestamp = Date.now();
    guardarEnLocalStorage();
    renderOrders("todas");
    renderMateriales();
    showScreen("screen-materiales");
  });
}

function renderCheckin() {
  const o = getOrdenActual();
  document.getElementById("checkinCliente").textContent = `${o.cliente} · ${o.direccion}`;
  const slider = document.getElementById("distanceSlider");
  actualizarDistancia(Number(slider.value));
}

function actualizarDistancia(valor) {
  document.getElementById("distanceValue").textContent = valor;
  document.getElementById("gpsPrecision").textContent = "8 m"; // valor mock de precisión
  const btn = document.getElementById("btnCheckin");
  btn.disabled = valor >= 50;
}

// ===== 4. MATERIALES =====
function initMateriales() {
  const form = document.getElementById("addMaterialForm");

  document.getElementById("btnAgregarMaterial").addEventListener("click", () => form.classList.remove("hidden"));
  document.getElementById("btnCancelarMaterial").addEventListener("click", () => {
    form.classList.add("hidden");
    limpiarFormMaterial();
  });

  document.getElementById("btnBuscarSku").addEventListener("click", () => {
    const sku = document.getElementById("inputSku").value.trim().toUpperCase();
    const item = CATALOGO_SKU[sku];
    if (item) {
      document.getElementById("inputNombreMaterial").value = item.nombre;
    } else {
      alert("SKU no encontrado en el catálogo mock.");
    }
  });

  document.getElementById("btnEscanearQr").addEventListener("click", () => {
    // TODO backend/hardware: integrar Web Camera API para leer QR real
    alert("Función de escaneo QR pendiente de conexión con la cámara (backend).");
  });

  document.getElementById("btnConfirmarMaterial").addEventListener("click", () => {
    const sku = document.getElementById("inputSku").value.trim().toUpperCase();
    const nombre = document.getElementById("inputNombreMaterial").value.trim();
    const cantidad = Number(document.getElementById("inputCantidad").value) || 1;
    const precio = (CATALOGO_SKU[sku] && CATALOGO_SKU[sku].precio) || 0;

    if (!nombre) {
      alert("Ingresá un nombre de material.");
      return;
    }

    const o = getOrdenActual();
    o.materiales.push({ sku: sku || "S/SKU", nombre, cantidad, precio });
    guardarEnLocalStorage();
    renderMateriales();
    form.classList.add("hidden");
    limpiarFormMaterial();
  });

  document.getElementById("btnIrCheckout").addEventListener("click", () => {
    renderCheckout();
    showScreen("screen-checkout");
  });
}

function limpiarFormMaterial() {
  document.getElementById("inputSku").value = "";
  document.getElementById("inputNombreMaterial").value = "";
  document.getElementById("inputCantidad").value = 1;
}

function renderMateriales() {
  const o = getOrdenActual();
  document.getElementById("estadoEnSitio").textContent =
    `En sitio · Orden #${o.id} (${o.cliente})`;

  const list = document.getElementById("materialsList");
  list.innerHTML = o.materiales.map((m, i) => `
    <div class="material-item">
      <div>
        <strong>${m.nombre}</strong>
        <span>${m.sku} · x${m.cantidad} · $${m.precio * m.cantidad}</span>
      </div>
      <button data-index="${i}"><i data-lucide="trash-2"></i></button>
    </div>
  `).join("") || `<p class="muted">Todavía no agregaste materiales.</p>`;

  list.querySelectorAll("button[data-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      o.materiales.splice(Number(btn.dataset.index), 1);
      guardarEnLocalStorage();
      renderMateriales();
    });
  });

  lucide.createIcons();
}

// ===== 5. CHECK-OUT =====
function initCheckout() {
  document.getElementById("btnFinalizar").addEventListener("click", () => {
    const o = getOrdenActual();
    o.estado = "finalizado";
    guardarEnLocalStorage();
    renderOrders("todas");

    document.getElementById("successBox").classList.remove("hidden");
    document.getElementById("btnFinalizar").disabled = true;

    setTimeout(() => {
      document.getElementById("successBox").classList.add("hidden");
      document.getElementById("btnFinalizar").disabled = false;
      currentOrderId = null;
      showScreen("screen-agenda");
    }, 1800);
  });
}

function renderCheckout() {
  const o = getOrdenActual();
  document.getElementById("resumenCliente").textContent = o.cliente;

  const minutos = o.checkinTimestamp
    ? Math.max(1, Math.round((Date.now() - o.checkinTimestamp) / 60000))
    : 0;
  document.getElementById("resumenTiempo").textContent = `${minutos} min`;

  const totalItems = o.materiales.reduce((a, m) => a + m.cantidad, 0);
  const costoTotal = o.materiales.reduce((a, m) => a + m.precio * m.cantidad, 0);

  document.getElementById("resumenMateriales").textContent = `${totalItems} ítem(s)`;
  document.getElementById("resumenCosto").textContent = `$${costoTotal}`;
}