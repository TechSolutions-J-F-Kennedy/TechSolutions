const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501')
  ? 'http://localhost:3000'
  : '';

// Variables globales
let idTecnicoSeleccionado = null;
let fechaSeleccionada = null;
let horaSeleccionada = null;
let listaTecnicosOriginal = []; // Almacena la lista de técnicos recuperada del backend

// -------------------------------------------------------------
// FUNCIONES GLOBALES (MODAL ALERTA PERSONALIZADO)
// -------------------------------------------------------------

window.mostrarAlerta = function(mensaje, titulo = "Notificación") {
  const modal = document.getElementById('custom-alert-modal');
  const msgElem = document.getElementById('custom-alert-message');
  const titleElem = document.getElementById('custom-alert-title');

  if (modal && msgElem) {
    msgElem.textContent = mensaje;
    if (titleElem) titleElem.textContent = titulo;
    modal.classList.add('active-modal');
    modal.style.setProperty('display', 'flex', 'important');
  } else {
    // Fallback simple si no existe el HTML
    console.warn("Modal de alerta no encontrado en el HTML:", mensaje);
  }
};

window.cerrarAlertaPersonalizada = function() {
  const modal = document.getElementById('custom-alert-modal');
  if (modal) {
    modal.classList.remove('active-modal');
    modal.style.setProperty('display', 'none', 'important');
  }
};

document.addEventListener('DOMContentLoaded', async () => {

  // 1. Obtener datos del usuario autenticado
  const usuarioGuardado = localStorage.getItem('usuario');
  let usuario = null;

  if (usuarioGuardado) {
    try {
      usuario = JSON.parse(usuarioGuardado);

      const displayName = document.getElementById('user-display-name');
      if (displayName) displayName.textContent = usuario.nombre || usuario.nombre_real || 'Usuario';

      const drawerName = document.getElementById('drawer-user-name');
      const drawerEmail = document.getElementById('drawer-user-email');
      
      if (drawerName) drawerName.textContent = usuario.nombre || usuario.nombre_real || 'Usuario';
      if (drawerEmail) drawerEmail.textContent = usuario.email || '';

      await cargarDireccionRealUsuario(usuario);

    } catch (e) {
      console.error('Error al parsear el usuario de localStorage:', e);
    }
  }

  // 2. Redirección al tocar "Cambiar" dirección
  const btnChangeLocation = document.getElementById('btn-change-location');
  if (btnChangeLocation) {
    btnChangeLocation.addEventListener('click', () => {
      window.location.href = 'cliente-perfil.html#direcciones';
    });
  }

  // 3. Funcionalidad del buscador principal (`#global-search`)
  const globalSearchInput = document.getElementById('global-search');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      // Si el usuario empieza a escribir en la vista principal, lo pasamos a la lista de técnicos
      if (query.length > 0 && viewWelcome && viewWelcome.classList.contains('active')) {
        showTechListView('Todos');
      }

      filtrarTecnicosEnPantalla(query);
    });
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
    if (sideDrawer) sideDrawer.classList.add('active');
    if (drawerOverlay) drawerOverlay.classList.add('active');
  }

  function closeMenu() {
    if (sideDrawer) sideDrawer.classList.remove('active');
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
    if (globalSearchInput) globalSearchInput.value = '';
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

      if (globalSearchInput) globalSearchInput.value = '';
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
      'reparación-pc': 'Reparación PC',
      'redes': 'Redes / Wi-Fi',
      'software': 'Software / Antivirus',
      'electricidad': 'Electricista',
      'plomeria-gas': 'Plomería / Gas',
      'electrodomesticos': 'Electrodomésticos'
    };

    const categoriaNombre = categoriasLegibles[tecnico.categoria] || tecnico.categoria || 'Técnico General';
    const descripcionTecnico = tecnico.descripcion || `Especialista en servicios de ${categoriaNombre}.`;
    
    const textoDistancia = tecnico.distancia_km !== undefined 
      ? `<span class="distance-chip"><i data-lucide="navigation"></i> a ${tecnico.distancia_km} km</span>` 
      : '';

    const promedioReal = (tecnico.reputacion_promedio && parseFloat(tecnico.reputacion_promedio) > 0)
      ? parseFloat(tecnico.reputacion_promedio).toFixed(1)
      : '5.0';

    contenedor.innerHTML += `
      <a href="tecnico-datos.html?id=${tecnico.id}" style="text-decoration: none; color: inherit; display: block;">
        <div class="tech-card tech-item-card" data-category="${tecnico.categoria || 'general'}" style="cursor: pointer;">
          <div class="tech-header">
            <div class="tech-avatar">${iniciales}</div>
            <div class="tech-details">
              <h4>${nombreReal} ${apellido}</h4>
              <div class="rating">
                <span class="stars">★ ${promedioReal}</span>
                <small>(${categoriaNombre})</small>
              </div>
            </div>
            
            <div class="tech-header-actions">
              <span class="status-badge available">Disponible</span>
              <button class="btn-chat-inline" onclick="event.preventDefault(); event.stopPropagation(); abrirChatConTecnico('${tecnico.id}', '${nombreReal} ${apellido}')" title="Enviar mensaje">
                <i data-lucide="message-square"></i>
              </button>
            </div>
          </div>

          <p class="tech-spec">${descripcionTecnico}</p>

          <div class="tech-meta" style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
            <span><i data-lucide="clock"></i> Disponible hoy</span>
            ${textoDistancia}
          </div>

          <button class="btn btn-primary btn-touch-sm btn-solicitar" 
                  onclick="event.preventDefault(); event.stopPropagation(); abrirModalReserva('${tecnico.id || 1}', '${nombreReal} ${apellido}', '${iniciales}', '${categoriaNombre}')">
            <i data-lucide="plus"></i> Solicitar servicio
          </button>
        </div>
      </a>
    `;
  }

  // Función auxiliar para quitar tildes y caracteres especiales
  function quitarTildes(texto) {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // Filtrado dinámico insensible a tildes, mayúsculas y minúsculas
  function filtrarTecnicosEnPantalla(query) {
    if (!contenedor) return;

    const queryLimpia = quitarTildes(query).trim();

    if (!queryLimpia) {
      renderizarListaTecnicos(listaTecnicosOriginal);
      return;
    }

    const filtrados = listaTecnicosOriginal.filter(t => {
      const nombre = quitarTildes(t.nombre || t.nombre_real || '');
      const apellido = quitarTildes(t.apellido || '');
      const nombreCompleto = `${nombre} ${apellido}`.trim();
      
      const username = quitarTildes(t.username || t.nombre_usuario || t.usuario || '');
      const categoria = quitarTildes(t.categoria || '');
      const descripcion = quitarTildes(t.descripcion || '');

      return nombreCompleto.includes(queryLimpia) || 
             nombre.includes(queryLimpia) || 
             apellido.includes(queryLimpia) || 
             username.includes(queryLimpia) || 
             categoria.includes(queryLimpia) || 
             descripcion.includes(queryLimpia);
    });

    renderizarListaTecnicos(filtrados);
  }

  function renderizarListaTecnicos(lista) {
    contenedor.innerHTML = '';

    if (lista.length === 0) {
      contenedor.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--muted);">
          <i data-lucide="user-x" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
          <p>No se encontraron técnicos para tu búsqueda.</p>
        </div>
      `;
    } else {
      lista.forEach(tecnico => agregarTarjetaTecnico(tecnico));
    }

    if (window.lucide) lucide.createIcons();
    if (techCount) techCount.textContent = `${lista.length} disponibles`;
  }

  // Consulta al Endpoint con cálculo de cercanía por Usuario ID
  async function obtenerTecnicosPorCercania(categoria = "todos") {
    try {
      contenedor.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--muted);">Calculando técnicos más cercanos...</p>';

      const catNormalizada = String(categoria).toLowerCase();
      const usuarioId = usuario ? usuario.id : null;

      let url = `${BASE_URL}/api/tecnicos/verTodosLosTecnicos`;

      if (usuarioId) {
        url = `${BASE_URL}/api/tecnicos/cercanos/${usuarioId}`;
        if (catNormalizada !== "todos") {
          url += `?categoria=${encodeURIComponent(categoria)}`;
        }
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        listaTecnicosOriginal = data.tecnicos || data.payload || [];
        
        const currentQuery = globalSearchInput ? globalSearchInput.value.toLowerCase().trim() : '';
        if (currentQuery) {
          filtrarTecnicosEnPantalla(currentQuery);
        } else {
          renderizarListaTecnicos(listaTecnicosOriginal);
        }
      } else {
        mostrarAlerta(data.error || 'No se pudieron consultar los técnicos.', 'Error');
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      contenedor.innerHTML = '<p style="text-align:center; color: red;">No se pudo conectar con el servidor.</p>';
    }
  }
});

// Función para cortar direcciones largas
function acortarTexto(texto, limite = 22) {
  if (!texto) return '';
  return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
}

// Carga de dirección en el banner superior
async function cargarDireccionRealUsuario(usuario) {
  const locationDisplay = document.getElementById('user-location-display');
  if (!locationDisplay) return;

  if (usuario.direccion) {
    locationDisplay.textContent = acortarTexto(usuario.direccion, 22);
    locationDisplay.title = usuario.direccion;
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/direcciones/principal/${usuario.id}`);

    if (response.ok) {
      const data = await response.json();
      if (data.payload && data.payload.direccion_completa) {
        const dir = data.payload.direccion_completa;
        locationDisplay.textContent = acortarTexto(dir, 22);
        locationDisplay.title = dir;

        usuario.direccion = dir;
        localStorage.setItem('usuario', JSON.stringify(usuario));
      } else {
        locationDisplay.textContent = 'Sin dirección';
      }
    } else {
      locationDisplay.textContent = 'Sin dirección';
    }
  } catch (error) {
    console.error("Error al obtener la dirección real:", error);
    locationDisplay.textContent = 'Dirección no disponible';
  }
}

// ==========================================
// LÓGICA DEL MODAL DE RESERVA / DISPONIBILIDAD
// ==========================================

function abrirModalReserva(id, nombre, iniciales, categoria) {
  idTecnicoSeleccionado = id;
  
  document.getElementById('modal-tech-name').textContent = nombre;
  document.getElementById('modal-tech-avatar').textContent = iniciales;
  document.getElementById('modal-tech-cat').textContent = categoria;

  generarDiasCarrusel();
  
  const modal = document.getElementById('modal-agendar');
  if (modal) modal.classList.add('active');
  
  if (window.lucide) lucide.createIcons();
}

function abrirChatConTecnico(tecnicoId, nombreCompleto) {
  localStorage.setItem('chatActivo_tecnicoId', tecnicoId);
  localStorage.setItem('chatActivo_nombreTecnico', nombreCompleto);
  window.location.href = '../html/chat-usuario.html';
}

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

  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  fechaSeleccionada = `${anio}-${mes}-${dia}`;
  
  cargarHorariosBackend(fechaSeleccionada);
}

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
      mostrarAlerta('Debes iniciar sesión para solicitar un servicio.', 'Sesión requerida');
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
        const modal = document.getElementById('modal-agendar');
        if (modal) modal.classList.remove('active');
        if (descripcionInput) descripcionInput.value = '';
        mostrarAlerta('¡Solicitud de servicio enviada con éxito!', 'Éxito');
      } else {
        mostrarAlerta(data.error || 'No se pudo enviar la solicitud.', 'Error');
      }
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      mostrarAlerta('Error de conexión con el servidor.', 'Error de Red');
    }
  });
}