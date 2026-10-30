const BASE_URL = window.location.origin;

let usuarioActual = null;
let nuevaDireccionModalObj = null;

// Cambiar entre Pestañas
window.switchTab = function (tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    if (element) element.classList.add('active');
};

document.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) lucide.createIcons();

    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
        window.location.href = '../index.html';
        return;
    }

    usuarioActual = JSON.parse(usuarioGuardado);
    renderizarVistaDatos();
    await cargarDirecciones(usuarioActual.id);
    configurarAutocompletadoModal();

    // Configurar Cerrar Sesión
    const logoutBtn = document.querySelector('.btn-danger-ghost');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuario');
            window.location.href = '../../index.html';
        });
    }
});

// Renderizar texto estático inicial
function renderizarVistaDatos() {
    document.getElementById('view-username').textContent = usuarioActual.nombre || '-';
    document.getElementById('view-email').textContent = usuarioActual.email || '-';
    document.getElementById('view-phone').textContent = usuarioActual.telefono || 'Sin registrar';

    const nameElement = document.querySelector('.user-name');
    const emailElement = document.querySelector('.user-email');
    const avatarElement = document.querySelector('.profile-avatar');

    if (nameElement) nameElement.textContent = usuarioActual.nombre;
    if (emailElement) emailElement.textContent = usuarioActual.email;
    if (avatarElement && usuarioActual.nombre) {
        avatarElement.textContent = usuarioActual.nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
}

// Activar modo edición
window.habilitarEdicionDatos = function () {
    document.getElementById('username').value = usuarioActual.nombre || '';
    document.getElementById('email').value = usuarioActual.email || '';
    document.getElementById('phone').value = usuarioActual.telefono || '';

    toggleModoEdicion(true);
};

window.cancelarEdicionDatos = function () {
    toggleModoEdicion(false);
};

function toggleModoEdicion(enEdicion) {
    const idsViews = ['view-username', 'view-email', 'view-phone'];
    const idsWraps = ['wrap-username', 'wrap-email', 'wrap-phone'];

    idsViews.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = enEdicion ? 'none' : 'block';
    });

    idsWraps.forEach(id => {
        const wrap = document.getElementById(id);
        if (wrap) {
            wrap.classList.toggle('is-hidden', !enEdicion);
            const input = wrap.querySelector('input');
            if (input) input.disabled = !enEdicion;
        }
    });

    const btnEditar = document.getElementById('btn-editar-datos');
    const actions = document.getElementById('actions-datos');

    if (btnEditar) btnEditar.style.display = enEdicion ? 'none' : 'inline-flex';
    if (actions) actions.classList.toggle('is-hidden', !enEdicion);
}

// Guardar cambios del perfil
window.guardarDatosUsuario = async function (e) {
    e.preventDefault();

    const payload = {
        nombre: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('phone').value.trim()
    };

    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            usuarioActual = { ...usuarioActual, ...payload };
            localStorage.setItem('usuario', JSON.stringify(usuarioActual));
            renderizarVistaDatos();
            toggleModoEdicion(false);
            
        } else {
            alert(data.error || "No se pudieron actualizar los datos.");
        }
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        alert("Error al conectar con el servidor.");
    }
};

// Cargar Direcciones y marcar la activa
async function cargarDirecciones(usuarioId) {
    const addressContainer = document.querySelector('.address-list');
    if (!addressContainer) return;

    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/direcciones`);
        const direcciones = await response.json();

        if (response.ok && direcciones.length > 0) {
            addressContainer.innerHTML = '';
            direcciones.forEach(dir => {
                const esPrincipal = dir.es_principal === 1;
                const html = `
                    <div class="address-card ${esPrincipal ? 'active' : ''}">
                        <div class="address-icon">
                            <i data-lucide="${(dir.alias || '').toLowerCase().includes('oficina') ? 'briefcase' : 'home'}"></i>
                        </div>
                        <div class="address-details">
                            <strong>${dir.alias || 'Dirección'} ${esPrincipal ? '(Principal)' : ''}</strong>
                            <p>${dir.direccion_completa}</p>
                        </div>
                        ${esPrincipal 
                            ? '<span class="check-badge"><i data-lucide="check"></i></span>'
                            : `<button class="btn btn-ghost btn-sm" onclick="marcarDireccionPrincipal(${dir.id})">Usar como principal</button>`
                        }
                    </div>
                `;
                addressContainer.innerHTML += html;
            });
            if (window.lucide) lucide.createIcons();
        } else {
            addressContainer.innerHTML = '<p class="text-center" style="color: var(--muted); font-size: 13px; padding: 12px 0;">No tienes direcciones guardadas.</p>';
        }
    } catch (error) {
        console.error("Error al cargar direcciones:", error);
    }
}

window.marcarDireccionPrincipal = async function (direccionId) {
    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioActual.id}/direcciones/${direccionId}/principal`, {
            method: 'PATCH'
        });

        if (response.ok) {
            await cargarDirecciones(usuarioActual.id);
        } else {
            alert("No se pudo cambiar la dirección principal.");
        }
    } catch (error) {
        console.error("Error al establecer principal:", error);
    }
};

// Autocompletado Nominatim en el Modal de Nueva Dirección
function configurarAutocompletadoModal() {
    const modalInputAddress = document.getElementById('dir-completa');
    const modalSuggestionsList = document.getElementById('modal-address-suggestions');

    if (!modalInputAddress || !modalSuggestionsList) return;

    let timeoutTimer;

    modalInputAddress.addEventListener('input', () => {
        clearTimeout(timeoutTimer);
        const query = modalInputAddress.value.trim();

        if (query.length < 4) {
            modalSuggestionsList.innerHTML = '';
            nuevaDireccionModalObj = null;
            return;
        }

        timeoutTimer = setTimeout(async () => {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&addressdetails=1&limit=5`;

            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'KennedyTechSolutions/1.0' }
                });
                const data = await res.json();

                modalSuggestionsList.innerHTML = '';

                data.forEach(place => {
                    const li = document.createElement('li');
                    li.className = 'suggestion-item';

                    const nombreCalle = place.address.road || place.name || 'Dirección';
                    const localidadProvincia = [
                        place.address.city || place.address.town || place.address.suburb || place.address.city_district,
                        place.address.state || 'Buenos Aires'
                    ].filter(Boolean).join(', ');

                    li.innerHTML = `
                        <div class="suggestion-icon"><i data-lucide="map-pin"></i></div>
                        <div class="suggestion-text">
                            <span class="street-name">${nombreCalle}</span>
                            <span class="location-name">${localidadProvincia}</span>
                        </div>
                    `;

                    li.onclick = () => {
                        modalInputAddress.value = place.display_name;
                        modalSuggestionsList.innerHTML = '';

                        nuevaDireccionModalObj = {
                            direccion_completa: place.display_name,
                            latitud: place.lat,
                            longitud: place.lon
                        };
                    };

                    modalSuggestionsList.appendChild(li);
                });

                if (window.lucide) lucide.createIcons();

            } catch (error) {
                console.error("Error al buscar direcciones en el modal:", error);
            }
        }, 400);
    });
}

window.abrirModalNuevaDireccion = () => document.getElementById('modal-direccion').showModal();

window.cerrarModalNuevaDireccion = () => {
    document.getElementById('modal-direccion').close();
    const suggestions = document.getElementById('modal-address-suggestions');
    if (suggestions) suggestions.innerHTML = '';
    nuevaDireccionModalObj = null;
};

window.guardarNuevaDireccion = async function (e) {
    e.preventDefault();

    const alias = document.getElementById('dir-alias').value.trim();
    const inputTexto = document.getElementById('dir-completa').value.trim();

    const direccionPayload = {
        alias: alias || 'Otra',
        direccion_completa: nuevaDireccionModalObj ? nuevaDireccionModalObj.direccion_completa : inputTexto,
        latitud: nuevaDireccionModalObj ? nuevaDireccionModalObj.latitud : null,
        longitud: nuevaDireccionModalObj ? nuevaDireccionModalObj.longitud : null
    };

    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioActual.id}/direcciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(direccionPayload)
        });

        if (response.ok) {
            cerrarModalNuevaDireccion();
            document.getElementById('form-nueva-direccion').reset();
            await cargarDirecciones(usuarioActual.id);
        } else {
            alert("Error al guardar la nueva dirección.");
        }
    } catch (error) {
        console.error("Error al guardar dirección:", error);
    }
};