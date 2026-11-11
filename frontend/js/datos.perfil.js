const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500')
  ? 'http://localhost:3000'
  : '';

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
    
    // Inicializar gestión de Foto de Perfil
    await cargarFotoPerfil(usuarioActual.id);
    configurarSubidaFoto();

    await cargarDirecciones(usuarioActual.id);
    configurarAutocompletadoModal();

    // Configurar Cerrar Sesión
    const logoutBtn = document.querySelector('.btn-danger-ghost');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuario');
            window.location.href = '../index.html';
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

    if (nameElement) nameElement.textContent = usuarioActual.nombre;
    if (emailElement) emailElement.textContent = usuarioActual.email;
    actualizarUIFoto(null);
}

// ================= GESTIÓN DE FOTO DE PERFIL =================

// 1. Cargar la foto guardada en la base de datos al iniciar
async function cargarFotoPerfil(usuarioId) {
    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/foto`);
        if (response.ok) {
            const data = await response.json();
            actualizarUIFoto(data.foto);
        }
    } catch (error) {
        console.error("Error al consultar foto de perfil:", error);
    }
}

// 2. Renderizar la foto en Base64 o mostrar las iniciales si no hay foto
function actualizarUIFoto(fotoBase64) {
    const avatarElement = document.querySelector('.profile-avatar');
    if (!avatarElement) return;

    if (fotoBase64) {
        avatarElement.innerHTML = `<img src="${fotoBase64}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else if (usuarioActual && usuarioActual.nombre) {
        avatarElement.textContent = usuarioActual.nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
}

// 3. Vincular el botón de la cámara con el input file y enviar al Backend
function configurarSubidaFoto() {
    const btnEditarAvatar = document.querySelector('.edit-avatar-btn');
    const inputFoto = document.getElementById('input-foto-perfil');

    if (!btnEditarAvatar || !inputFoto) return;

    btnEditarAvatar.addEventListener('click', () => {
        inputFoto.click();
    });

    inputFoto.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Achicar y comprimir la foto antes de enviar
            const base64Comprimido = await comprimirImagenBase64(file, 400, 400, 0.7);

            const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioActual.id}/foto`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto: base64Comprimido })
            });

            const data = await response.json();

            if (response.ok) {
                actualizarUIFoto(base64Comprimido);
            } else {
                alert(data.error || "No se pudo actualizar la foto de perfil.");
            }
        } catch (error) {
            console.error("Error al procesar la foto:", error);
            alert("Error al procesar la imagen seleccionada.");
        } finally {
            inputFoto.value = '';
        }
    });
}

// 4. Redimensionar/comprimir imagen en Canvas para no exceder los límites del servidor
function comprimirImagenBase64(file, maxAncho, maxAlto, calidad) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxAncho) {
                        height = Math.round((height * maxAncho) / width);
                        width = maxAncho;
                    }
                } else {
                    if (height > maxAlto) {
                        width = Math.round((width * maxAlto) / height);
                        height = maxAlto;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const base64Data = canvas.toDataURL('image/jpeg', calidad);
                resolve(base64Data);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// ================= FIN GESTIÓN DE FOTO DE PERFIL =================

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
// ================= GESTIÓN DE HISTORIAL DE RESEÑAS =================

// Cargar reseñas al entrar al perfil
document.addEventListener('DOMContentLoaded', () => {
    // ... tus llamadas anteriores ...
    if (usuarioActual && usuarioActual.id) {
        cargarHistorialResenas(usuarioActual.id);
    }
});

async function cargarHistorialResenas(clienteId) {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    try {
        const res = await fetch(`${BASE_URL}/api/resenas/cliente/${clienteId}`);
        const resenas = await res.json();

        if (res.ok && resenas.length > 0) {
            historyList.innerHTML = '';
            resenas.forEach(r => {
                const estrellasStr = '⭐'.repeat(r.estrella);
                const fechaFormatted = new Date(r.fecha).toLocaleDateString('es-AR');

                const card = document.createElement('div');
                card.className = 'address-card';
                card.style.flexDirection = 'column';
                card.style.alignItems = 'flex-start';
                card.style.gap = '8px';
                card.style.marginBottom = '12px';

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <strong>Técnico: ${r.tecnico_nombre || 'Técnico TechSolutions'}</strong>
                        <span style="font-size: 12px; color: var(--muted);">${fechaFormatted}</span>
                    </div>
                    <div style="color: #f59e0b; font-size: 14px;">${estrellasStr} (${r.estrella}/5)</div>
                    <p style="margin: 0; font-size: 13px; color: var(--text-main);">${r.comentario || 'Sin comentario escrito.'}</p>
                    <div style="display: flex; gap: 8px; margin-top: 6px; width: 100%; justify-content: flex-end;">
                        <button class="btn btn-ghost btn-sm" onclick="abrirModalEditarResena(${r.servicio_id}, ${r.tecnico_id}, ${r.estrella}, '${encodeURIComponent(r.comentario || '')}')">
                            <i data-lucide="edit-2"></i> Editar
                        </button>
                        <button class="btn btn-ghost btn-sm" style="color: #ef4444;" onclick="eliminarResenaHistorial(${r.id})">
                            <i data-lucide="trash-2"></i> Eliminar
                        </button>
                    </div>
                `;
                historyList.appendChild(card);
            });
            if (window.lucide) lucide.createIcons();
        } else {
            historyList.innerHTML = '<p style="color: var(--muted); font-size: 13px; text-align: center; padding: 12px 0;">No has realizado reseñas aún.</p>';
        }
    } catch (error) {
        console.error("Error al cargar historial de reseñas:", error);
    }
}

// Abrir modal de edición prellenando campos
window.abrirModalEditarResena = function(servicioId, tecnicoId, estrella, comentarioEnc) {
    const comentario = decodeURIComponent(comentarioEnc);
    document.getElementById('edit-resena-servicio-id').value = servicioId;
    document.getElementById('edit-resena-servicio-id').dataset.tecnicoId = tecnicoId;
    document.getElementById('edit-resena-estrella').value = estrella;
    document.getElementById('edit-resena-comentario').value = comentario;

    document.getElementById('modal-editar-resena').showModal();
};

window.cerrarModalEditarResena = function() {
    document.getElementById('modal-editar-resena').close();
};

// Guardar cambios aprovechando el upsert del endpoint POST /api/resenas
window.guardarEdicionResena = async function(e) {
    e.preventDefault();

    const servicio_id = document.getElementById('edit-resena-servicio-id').value;
    const tecnico_id = document.getElementById('edit-resena-servicio-id').dataset.tecnicoId;
    const estrella = document.getElementById('edit-resena-estrella').value;
    const comentario = document.getElementById('edit-resena-comentario').value.trim();

    try {
        const response = await fetch(`${BASE_URL}/api/resenas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                servicio_id,
                cliente_id: usuarioActual.id,
                tecnico_id,
                estrella,
                comentario
            })
        });

        if (response.ok) {
            cerrarModalEditarResena();
            await cargarHistorialResenas(usuarioActual.id);
        } else {
            alert("No se pudo actualizar la reseña.");
        }
    } catch (error) {
        console.error("Error al guardar reseña:", error);
    }
};

// Eliminar reseña
window.eliminarResenaHistorial = async function(resenaId) {
    if (!confirm("¿Estás seguro de que querés eliminar esta reseña?")) return;

    try {
        const response = await fetch(`${BASE_URL}/api/resenas/${resenaId}?cliente_id=${usuarioActual.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await cargarHistorialResenas(usuarioActual.id);
        } else {
            alert("No se pudo eliminar la reseña.");
        }
    } catch (error) {
        console.error("Error al eliminar reseña:", error);
    }
};