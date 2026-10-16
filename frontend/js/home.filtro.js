const BASE_URL = "http://localhost:3000";

// Variables globales para el modal de reserva
let idTecnicoSeleccionado = null;
let fechaSeleccionada = null;
let horaSeleccionada = null;

document.addEventListener('DOMContentLoaded', () => {

  // 1. Obtener datos del usuario autenticado
  const usuarioGuardado = localStorage.getItem('usuario');
  let usuario = null;

  if (usuarioGuardado) {
    try {
      usuario = JSON.parse(usuarioGuardado);

      const displayName = document.getElementById('user-display-name');
      if (displayName) displayName.textContent = usuario.nombre || 'Usuario';

      const drawerName = document.getElementById('drawer-user-name');
      const drawerEmail = document.getElementById('drawer-user-email');
      
      if (drawerName) drawerName.textContent = usuario.nombre || 'Usuario';
      if (drawerEmail) drawerEmail.textContent = usuario.email || '';
    } catch (e) {
      console.error('Error al parsear el usuario de localStorage:', e);
    }
  }

  // Inicializar íconos de Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // Menú Drawer Lateral
  const menuBtn = document.getElementById('menu-btn');
  const sideDrawer = document.getElementById('side-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');

  function openMenu() {
    if (sideDrawer) sideDrawer.classList.add('open');
    if (drawerOverlay) drawerOverlay.classList.add('active');
  }

  function closeMenu() {
    if (sideDrawer) sideDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.remove('active');
  }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeMenu);

  // Vistas principales
  const viewWelcome = document.getElementById('view-welcome');
  const viewTechList = document.getElementById('view-tech-list');
  const btnExploreAll = document.getElementById('btn-explore-all');
  const btnBackHome = document.getElementById('btn-back-home');
  const navBtnHome = document.getElementById('nav-btn-home');
  const activeFilterLabel = document.getElementById('active-filter-label');
  const categoryCards = document.querySelectorAll('.category-card');
  const filterChips = document.querySelectorAll('.chip-filter');
  const contenedor = document.getElementById('tech-list-container');
  const techCount = document.getElementById('tech-count');

  function showWelcomeView() {
    if (viewWelcome) viewWelcome.classList.add('active');
    if (viewTechList) viewTechList.classList.remove('active');
    window.scrollTo(0, 0);
  }

  function showTechListView(categoryName = 'Todos') {
    if (viewWelcome) viewWelcome.classList.remove('active');
    if (viewTechList) viewTechList.classList.add('active');
    
    if (activeFilterLabel) {
      activeFilterLabel.textContent = categoryName === 'Todos' 
        ? 'Todos los técnicos (por cercanía)' 
        : `Categoría: ${categoryName}`;
    }

    filterChips.forEach(chip => {
      if (chip.dataset.filter === categoryName) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    obtenerTecnicosPorCercania(categoryName);
    window.scrollTo(0, 0);
  }

  if (btnExploreAll) btnExploreAll.addEventListener('click', () => showTechListView('Todos'));
  if (btnBackHome) btnBackHome.addEventListener('click', showWelcomeView);
  if (navBtnHome) navBtnHome.addEventListener('click', showWelcomeView);

  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedCat = card.dataset.category;
      showTechListView(selectedCat);
    });
  });

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;
      if (activeFilterLabel) {
        activeFilterLabel.textContent = filter === 'Todos' 
          ? 'Todos los técnicos (por cercanía)' 
          : `Categoría: ${filter}`;
      }

      obtenerTecnicosPorCercania(filter);
    });
  });

  // Renderizado dinámico de la tarjeta del técnico
  function agregarTarjetaTecnico(tecnico) {
    const nombreReal = tecnico.nombre || tecnico.nombre_real || 'Técnico';
    const apellido = tecnico.apellido || '';
    
    const iniciales = (nombreReal && apellido) 
      ? `${nombreReal[0]}${apellido[0]}`.toUpperCase() 
      : nombreReal.slice(0, 2).toUpperCase();

    const categoriasLegibles = {
      'reparacion-pc': 'Reparación PC',
      'redes': 'Redes / Wi-Fi',
      'software': 'Software / Antivirus',
      'electricidad': 'Electricista',
      'plomeria-gas': 'Plomería / Gas',
      'electrodomesticos': 'Electrodomésticos'
    };

    const categoriaNombre = categoriasLegibles[tecnico.categoria] || tecnico.categoria || 'Técnico General';
    const descripcionTecnico = tecnico.descripcion || `Especialista en servicios de ${categoriaNombre}.`;
    
    // Distancia formateada si el backend la proporciona
    const textoDistancia = tecnico.distancia_km !== undefined 
      ? `<span class="distance-chip"><i data-lucide="navigation"></i> a ${tecnico.distancia_km} km</span>` 
      : '';

    contenedor.innerHTML += `
      <div class="tech-card" data-category="${tecnico.categoria || 'general'}">
        <div class="tech-header">
          <div class="tech-avatar">${iniciales}</div>
          <div class="tech-details">
            <h4>${nombreReal} ${apellido}</h4>
            <div class="rating">
              <span class="stars">★ ${tecnico.reputacion_promedio || '5.0'}</span>
              <small>(${categoriaNombre})</small>
            </div>
          </div>
          <span class="status-badge available">Disponible</span>
        </div>

        <p class="tech-spec">${descripcionTecnico}</p>

        <div class="tech-meta" style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
          <span><i data-lucide="clock"></i> Disponible hoy</span>
          ${textoDistancia}
        </div>

        <button class="btn btn-primary btn-touch-sm btn-solicitar" 
                onclick="abrirModalReserva('${tecnico.id || 1}', '${nombreReal} ${apellido}', '${iniciales}', '${categoriaNombre}')">
          <i data-lucide="plus"></i> Solicitar servicio
        </button>
      </div>
    `;
  }

  // Consulta al Endpoint con cálculo de cercanía por Usuario ID
  async function obtenerTecnicosPorCercania(categoria = "todos") {
    try {
      contenedor.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--muted);">Calculando técnicos más cercanos...</p>';

      const catNormalizada = String(categoria).toLowerCase();
      const usuarioId = usuario ? usuario.id : null;

      let url = `${BASE_URL}/api/tecnicos/verTodosLosTecnicos`;

      // Si el usuario tiene sesión, usamos la ruta de cálculo de distancia
      if (usuarioId) {
        url = `${BASE_URL}/api/tecnicos/cercanos/${usuarioId}`;
        if (catNormalizada !== "todos") {
          url += `?categoria=${encodeURIComponent(categoria)}`;
        }
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        contenedor.innerHTML = '';
        const listaTecnicos = data.tecnicos || data.payload || [];

        if (listaTecnicos.length === 0) {
          contenedor.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; color: var(--muted);">
              <i data-lucide="user-x" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
              <p>No se encontraron técnicos disponibles para esta categoría.</p>
            </div>
          `;
        } else {
          listaTecnicos.forEach(tecnico => {
            agregarTarjetaTecnico(tecnico);
          });
        }

        if (window.lucide) {
          lucide.createIcons();
        }

        if (techCount) {
          techCount.textContent = `${listaTecnicos.length} disponibles`;
        }

      } else {
        alert('Error: ' + (data.error || 'No se pudieron consultar los técnicos.'));
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      contenedor.innerHTML = '<p style="text-align:center; color: red;">No se pudo conectar con el servidor.</p>';
    }
  }
});

// ==========================================
// LÓGICA DEL MODAL DE RESERVA / DISPONIBILIDAD
// ==========================================

function abrirModalReserva(id, nombre, iniciales, categoria) {
  idTecnicoSeleccionado = id;
  
  document.getElementById('modal-tech-name').textContent = nombre;
  document.getElementById('modal-tech-avatar').textContent = iniciales;
  document.getElementById('modal-tech-cat').textContent = categoria;

  // Cargar carrusel de días partiendo de hoy
  generarDiasCarrusel();
  
  // Mostrar modal
  const modal = document.getElementById('modal-agendar');
  if (modal) modal.classList.add('active');
  
  if (window.lucide) lucide.createIcons();
}

// Evento para cerrar modal
const btnCloseModal = document.getElementById('btn-close-modal');
if (btnCloseModal) {
  btnCloseModal.addEventListener('click', () => {
    document.getElementById('modal-agendar').classList.remove('active');
  });
}

function generarDiasCarrusel() {
  const container = document.getElementById('days-carousel');
  if (!container) return;
  container.innerHTML = '';

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoy = new Date();

  for (let i = 0; i < 7; i++) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);

    const diaNombre = diasSemana[fecha.getDay()];
    const diaNum = fecha.getDate();
    
    // Generar formato ISO YYYY-MM-DD
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaISO = `${anio}-${mes}-${dia}`;

    const dayCard = document.createElement('div');
    dayCard.className = `day-card ${i === 0 ? 'selected' : ''}`;
    dayCard.innerHTML = `
      <span class="day-name">${i === 0 ? 'Hoy' : diaNombre}</span>
      <span class="day-num">${diaNum}</span>
    `;

    dayCard.onclick = () => {
      document.querySelectorAll('.day-card').forEach(c => c.classList.remove('selected'));
      dayCard.classList.add('selected');
      fechaSeleccionada = fechaISO;
      cargarHorariosBackend(fechaISO);
    };

    container.appendChild(dayCard);
  }

  // Seleccionar hoy por defecto
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  fechaSeleccionada = `${anio}-${mes}-${dia}`;
  
  cargarHorariosBackend(fechaSeleccionada);
}

// Consultar franjas horarias reales en el backend
async function cargarHorariosBackend(fecha) {
  const grid = document.getElementById('time-grid');
  if (!grid) return;

  grid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: var(--muted);">Cargando disponibilidad...</p>';
  horaSeleccionada = null;
  validarFormulario();

  try {
    const res = await fetch(`${BASE_URL}/api/tecnicos/${idTecnicoSeleccionado}/disponibilidad?fecha=${fecha}`);
    const data = await res.json();

    grid.innerHTML = '';

    if (!res.ok) {
      grid.innerHTML = `<p style="grid-column: span 3; color: red;">${data.error || 'Error al cargar horarios'}</p>`;
      return;
    }

    if (!data.slots || data.slots.length === 0) {
      grid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: var(--muted);">El técnico no tiene turnos configurados para este día.</p>';
      return;
    }

    data.slots.forEach(slot => {
      const timeBtn = document.createElement('button');
      timeBtn.type = 'button';
      timeBtn.className = `time-chip ${slot.ocupado ? 'disabled' : ''}`;
      timeBtn.textContent = slot.hora;

      if (!slot.ocupado) {
        timeBtn.onclick = () => {
          document.querySelectorAll('.time-chip').forEach(t => t.classList.remove('selected'));
          timeBtn.classList.add('selected');
          horaSeleccionada = slot.hora;
          validarFormulario();
        };
      }

      grid.appendChild(timeBtn);
    });

  } catch (error) {
    console.error('Error al obtener horarios:', error);
    grid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: red;">No se pudo conectar con el servidor.</p>';
  }
}

function validarFormulario() {
  const btnSubmit = document.getElementById('btn-confirm-booking');
  if (btnSubmit) {
    btnSubmit.disabled = !(fechaSeleccionada && horaSeleccionada);
  }
}

// Enviar solicitud de servicio al Backend
const btnConfirmBooking = document.getElementById('btn-confirm-booking');
if (btnConfirmBooking) {
  btnConfirmBooking.addEventListener('click', async () => {
    const usuarioStorage = localStorage.getItem('usuario');
    if (!usuarioStorage) {
      alert('Debes iniciar sesión para solicitar un servicio.');
      return;
    }

    const usuarioObj = JSON.parse(usuarioStorage);
    const descripcionInput = document.getElementById('problem-desc');

    const payload = {
      cliente_id: usuarioObj.id,
      tecnico_id: idTecnicoSeleccionado,
      fecha_servicio: fechaSeleccionada,
      hora_servicio: horaSeleccionada,
      descripcion: descripcionInput ? descripcionInput.value : '',
      direccion: usuarioObj.direccion || 'Av. Principal 1234, CABA'
    };

    try {
      const res = await fetch(`${BASE_URL}/api/servicios/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert('¡Solicitud enviada con éxito!');
        const modal = document.getElementById('modal-agendar');
        if (modal) modal.classList.remove('active');
        if (descripcionInput) descripcionInput.value = '';
      } else {
        alert('Error: ' + (data.error || 'No se pudo enviar la solicitud.'));
      }
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      alert('Error de conexión con el servidor.');
    }
  });
}