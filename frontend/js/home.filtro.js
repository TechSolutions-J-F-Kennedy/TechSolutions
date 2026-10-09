document.addEventListener('DOMContentLoaded', () => {


  const usuarioGuardado = localStorage.getItem('usuario');
  
  if (usuarioGuardado) {
    try {
      const usuario = JSON.parse(usuarioGuardado);

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

  const menuBtn = document.getElementById('menu-btn');
  const sideDrawer = document.getElementById('side-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');

  function openMenu() {
    sideDrawer.classList.add('open');
    drawerOverlay.classList.add('active');
  }

  function closeMenu() {
    sideDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
  }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeMenu);


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
    viewWelcome.classList.add('active');
    viewTechList.classList.remove('active');
    window.scrollTo(0, 0);
  }

  function showTechListView(categoryName = 'Todos') {
    viewWelcome.classList.remove('active');
    viewTechList.classList.add('active');
    
    if (activeFilterLabel) {
      activeFilterLabel.textContent = categoryName === 'Todos' 
        ? 'Todos los técnicos' 
        : `Categoría: ${categoryName}`;
    }

    filterChips.forEach(chip => {
      if (chip.dataset.filter === categoryName) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    obtenerTecnicos(categoryName);
    window.scrollTo(0, 0);
  }

  if (btnExploreAll) btnExploreAll.addEventListener('click', () => showTechListView('Todos'));
  if (btnBackHome) btnBackHome.addEventListener('click', showWelcomeView);
  if (navBtnHome) navBtnHome.addEventListener('click', showWelcomeView);

  // Evento para tarjetas principales de inicio
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedCat = card.dataset.category;
      showTechListView(selectedCat);
    });
  });

  // Evento para chips deslizables en la lista
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;
      if (activeFilterLabel) {
        activeFilterLabel.textContent = filter === 'Todos' 
          ? 'Todos los técnicos' 
          : `Categoría: ${filter}`;
      }

      obtenerTecnicos(filter);
    });
  });



 function agregarTarjetaTecnico(tecnico) {
  const nombreReal = tecnico.nombre_real || '';
  const apellido = tecnico.apellido || '';
  
  const iniciales = (nombreReal && apellido) 
    ? `${nombreReal[0]}${apellido[0]}`.toUpperCase() 
    : (tecnico.nombre ? tecnico.nombre.slice(0, 2).toUpperCase() : 'TC');

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

      <p class="tech-spec">
        ${descripcionTecnico}
      </p>

      <div class="tech-meta">
        <span><i data-lucide="clock"></i> Disponible hoy</span>
      </div>

      <button class="btn btn-primary btn-touch-sm">
        <i data-lucide="plus"></i> Solicitar servicio
      </button>
    </div>
  `;
}

  async function obtenerTecnicos(categoria = 'todos') {
    if (!contenedor) return;

    try {
      contenedor.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--muted);">Cargando técnicos...</p>';

      const response = await fetch('http://localhost:3000/api/tecnicos/verTecnicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria })
      });

      const data = await response.json();

      if (response.ok) {
        contenedor.innerHTML = ''; // Limpiar previo
        const listaTecnicos = data.payload || [];

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