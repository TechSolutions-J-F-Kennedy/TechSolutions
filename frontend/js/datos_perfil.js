const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500')
  ? 'http://localhost:3000'
  : '';

let usuarioActual = null;
let nuevaDireccionModalObj = null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cambiar entre Pestañas
window.switchTab = function (tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    if (element) element.classList.add('active');
};

// Desplegar u ocultar el formulario de Seguridad y Contraseña
window.toggleSeccionPassword = function () {
    const formPass = document.getElementById('form-cambiar-password');
    const chevron = document.getElementById('icon-chevron-password');
    if (!formPass) return;

    const estaOculto = formPass.classList.toggle('is-hidden');
    if (chevron) {
        chevron.style.transform = estaOculto ? 'rotate(0deg)' : 'rotate(180deg)';
        chevron.style.transition = 'transform 0.2s ease';
    }
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
    
    await cargarFotoPerfil(usuarioActual.id);
    configurarSubidaFoto();

    await cargarDirecciones(usuarioActual.id);
    configurarAutocompletadoModal();

    // Configurar Cerrar Sesión apuntando únicamente al ID exclusivo #btn-cerrar-sesion
    const logoutBtn = document.getElementById('btn-cerrar-sesion');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const result = await Swal.fire({
                title: '¿Cerrar sesión?',
                text: 'Vas a salir de tu cuenta actual.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                localStorage.removeItem('usuario');
                window.location.href = '../index.html';
            }
        });
    }

    if (usuarioActual && usuarioActual.id) {
        cargarHistorialResenas(usuarioActual.id);
    }
});

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

// FOTO DE PERFIL
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

function actualizarUIFoto(fotoBase64) {
    const avatarElement = document.querySelector('.profile-avatar');
    if (!avatarElement) return;

    if (fotoBase64) {
        avatarElement.innerHTML = `<img src="${fotoBase64}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else if (usuarioActual && usuarioActual.nombre) {
        avatarElement.textContent = usuarioActual.nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
}

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
            const base64Comprimido = await comprimirImagenBase64(file, 400, 400, 0.7);

            const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioActual.id}/foto`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto: base64Comprimido })
            });

            const data = await response.json();

            if (response.ok) {
                actualizarUIFoto(base64Comprimido);
                Swal.fire({
                    icon: 'success',
                    title: '¡Foto actualizada!',
                    text: 'Tu foto de perfil se actualizó correctamente.',
                    timer: 1800,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de foto',
                    text: data.error || 'No se pudo actualizar la foto de perfil.'
                });
            }
        } catch (error) {
            console.error("Error al procesar la foto:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error de imagen',
                text: 'Error al procesar la imagen seleccionada.'
            });
        } finally {
            inputFoto.value = '';
        }
    });
}

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

// EDICIÓN DE DATOS PERSONALES CON MISMAS VALIDACIONES DEL REGISTRO
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

window.guardarDatosUsuario = async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const telefonoRaw = document.getElementById('phone').value.trim();
    const telefono = telefonoRaw.replace(/\D/g, '');

    if (nombre.length < 4) {
        return Swal.fire({
            icon: 'warning',
            title: 'Usuario inválido',
            text: 'El nombre de usuario debe contener al menos 4 caracteres.'
        });
    }

    if (!EMAIL_REGEX.test(email)) {
        return Swal.fire({
            icon: 'warning',
            title: 'Correo inválido',
            text: 'Ingresá un formato de correo electrónico válido.'
        });
    }

    if (telefono.length !== 10) {
        return Swal.fire({
            icon: 'warning',
            title: 'Teléfono inválido',
            text: 'El número de teléfono debe contener exactamente 10 dígitos (ej: 1112345678).'
        });
    }

    const payload = { nombre, email, telefono };

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

            Swal.fire({
                icon: 'success',
                title: '¡Perfil actualizado!',
                text: 'Tus datos personales se guardaron correctamente.',
                timer: 1800,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error de actualización',
                text: data.error || 'No se pudieron actualizar los datos.'
            });
        }
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Error al conectar con el servidor.'
        });
    }
};

// CAMBIO DE CONTRASEÑA CON VERIFICACIÓN PREVIA
window.guardarNuevaPassword = async function(e) {
    e.preventDefault();

    const passwordActual = document.getElementById('pass-actual').value;
    const nuevaPassword = document.getElementById('pass-nueva').value;
    const confirmarPassword = document.getElementById('pass-confirmar').value;

    if (nuevaPassword.length < 4) {
        return Swal.fire({
            icon: 'warning',
            title: 'Contraseña débil',
            text: 'La nueva contraseña debe tener al menos 4 caracteres.'
        });
    }

    if (nuevaPassword !== confirmarPassword) {
        return Swal.fire({
            icon: 'warning',
            title: 'Contraseñas no coinciden',
            text: 'La nueva contraseña y su confirmación no coinciden.'
        });
    }

    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioActual.id}/password`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passwordActual, nuevaPassword })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('form-cambiar-password').reset();
            toggleSeccionPassword();
            Swal.fire({
                icon: 'success',
                title: '¡Contraseña cambiada!',
                text: 'Tu clave se modificó exitosamente.',
                timer: 1800,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error de clave',
                text: data.error || 'No se pudo cambiar la contraseña.'
            });
        }
    } catch (error) {
        console.error("Error al modificar contraseña:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Error al conectar con el servidor.'
        });
    }
};

// GESTIÓN DE DIRECCIONES (EDITAR / ELIMINAR / MARCAR PRINCIPAL)
async function cargarDirecciones(usuarioId) {
    const addressContainer = document.querySelector('.address-list');
    if (!addressContainer) return;

    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/direcciones`);
        const direcciones = await response.json();

        if (response.ok && direcciones.length > 0) {
            addressContainer.innerHTML = '';
            direcciones.forEach(dir => {
                const esPrincipal = Number(dir.es_principal) === 1;
                const aliasEnc = encodeURIComponent(dir.alias || 'Dirección').replace(/'/g, '%27');
                const dirEnc = encodeURIComponent(dir.direccion_completa || '').replace(/'/g, '%27');

                const card = document.createElement('div');
                card.className = `address-card ${esPrincipal ? 'active' : ''}`;

                card.innerHTML = `
                    <div class="address-icon">
                        <i data-lucide="${(dir.alias || '').toLowerCase().includes('oficina') ? 'briefcase' : 'home'}"></i>
                    </div>
                    <div class="address-details" style="flex: 1;">
                        <strong>${escaparHTML(dir.alias || 'Dirección')} ${esPrincipal ? '(Principal)' : ''}</strong>
                        <p>${escaparHTML(dir.direccion_completa)}</p>
                        <div class="address-actions">
                            <button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalEditarDireccion(${Number(dir.id)}, '${aliasEnc}', '${dirEnc}')">
                                <i data-lucide="edit-2"></i> Editar
                            </button>
                            ${esPrincipal 
                                ? ''
                                : `<button type="button" class="btn btn-ghost btn-sm" onclick="marcarDireccionPrincipal(${Number(dir.id)})">Usar como principal</button>
                                   <button type="button" class="btn btn-danger-ghost btn-sm" onclick="eliminarDireccion(${Number(dir.id)})" title="Eliminar dirección"><i data-lucide="trash-2"></i></button>`
                            }
                        </div>
                    </div>
                    ${esPrincipal ? '<span class="check-badge" title="Dirección Principal"><i data-lucide="check"></i></span>' : ''}
                `;
                addressContainer.appendChild(card);
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
            Swal.fire({
                icon: 'success',
                title: 'Dirección principal establecida',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cambiar la dirección principal.'
            });
        }
    } catch (error) {
        console.error("Error al establecer principal:", error);
    }
};

// Eliminar Dirección
window.eliminarDireccion = async function (direccionId) {
    const result = await Swal.fire({
        title: '¿Eliminar dirección?',
        text: 'La dirección se removerá de tu lista guardada.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioActual.id}/direcciones/${direccionId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            await cargarDirecciones(usuarioActual.id);
            Swal.fire({
                icon: 'success',
                title: 'Dirección eliminada',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo eliminar',
                text: data.error || 'Ocurrió un error al borrar la dirección.'
            });
        }
    } catch (error) {
        console.error("Error al eliminar dirección:", error);
    }
};

// MODAL DIRECCIONES (CREAR / EDITAR)
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

window.abrirModalNuevaDireccion = () => {
    document.getElementById('modal-direccion-titulo').textContent = 'Nueva Dirección';
    document.getElementById('dir-edit-id').value = '';
    document.getElementById('form-nueva-direccion').reset();
    nuevaDireccionModalObj = null;
    document.getElementById('modal-direccion').showModal();
};

window.abrirModalEditarDireccion = (id, aliasEnc, dirEnc) => {
    document.getElementById('modal-direccion-titulo').textContent = 'Editar Dirección';
    document.getElementById('dir-edit-id').value = id;
    document.getElementById('dir-alias').value = decodeURIComponent(aliasEnc);
    document.getElementById('dir-completa').value = decodeURIComponent(dirEnc);
    nuevaDireccionModalObj = null;
    document.getElementById('modal-direccion').showModal();
};

window.cerrarModalNuevaDireccion = () => {
    document.getElementById('modal-direccion').close();
    const suggestions = document.getElementById('modal-address-suggestions');
    if (suggestions) suggestions.innerHTML = '';
    nuevaDireccionModalObj = null;
};

window.guardarDireccionModal = async function (e) {
    e.preventDefault();

    const editId = document.getElementById('dir-edit-id').value;
    const alias = document.getElementById('dir-alias').value.trim();
    const inputTexto = document.getElementById('dir-completa').value.trim();

    if (inputTexto.length < 5) {
        return Swal.fire({
            icon: 'warning',
            title: 'Dirección muy corta',
            text: 'Ingresá una calle y altura válida de al menos 5 caracteres.'
        });
    }

    const direccionPayload = {
        alias: alias || 'Dirección',
        direccion_completa: nuevaDireccionModalObj ? nuevaDireccionModalObj.direccion_completa : inputTexto,
        latitud: nuevaDireccionModalObj ? nuevaDireccionModalObj.latitud : null,
        longitud: nuevaDireccionModalObj ? nuevaDireccionModalObj.longitud : null
    };

    const isEdit = !!editId;
    const url = isEdit 
        ? `${BASE_URL}/api/usuarios/${usuarioActual.id}/direcciones/${editId}` 
        : `${BASE_URL}/api/usuarios/${usuarioActual.id}/direcciones`;
    
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(direccionPayload)
        });

        const data = await response.json();

        if (response.ok) {
            cerrarModalNuevaDireccion();
            document.getElementById('form-nueva-direccion').reset();
            await cargarDirecciones(usuarioActual.id);

            Swal.fire({
                icon: 'success',
                title: isEdit ? '¡Dirección actualizada!' : '¡Dirección agregada!',
                text: 'Se guardó correctamente en tu cuenta.',
                timer: 1800,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Error al guardar la dirección.'
            });
        }
    } catch (error) {
        console.error("Error al guardar dirección:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor.'
        });
    }
};

// HISTORIAL DE RESEÑAS
function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

async function cargarHistorialResenas(clienteId) {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    try {
        const res = await fetch(`${BASE_URL}/api/resenas/cliente/${clienteId}`);
        const resenas = await res.json();

        if (res.ok && resenas.length > 0) {
            historyList.innerHTML = '';
            resenas.forEach(r => {
                const tecnico = r.tecnico_nombre || 'Técnico TechSolutions';
                const iniciales = tecnico.split(' ').filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'TC';

                const partesFecha = String(r.fecha || '').split('T')[0].split('-');
                const fechaFormatted = partesFecha.length === 3
                    ? `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`
                    : '';

                let estrellasHtml = '';
                for (let i = 1; i <= 5; i++) {
                    estrellasHtml += `<i data-lucide="star" class="${i <= r.estrella ? 'on' : ''}"></i>`;
                }

                const comentarioEnc = encodeURIComponent(r.comentario || '').replace(/'/g, '%27');

                const card = document.createElement('article');
                card.className = 'resena-card';

                card.innerHTML = `
                    <header class="resena-head">
                        <div class="resena-avatar">${escaparHTML(iniciales)}</div>
                        <div class="resena-quien">
                            <span class="resena-nombre"><strong>${escaparHTML(tecnico)}</strong></span>
                            <small>${fechaFormatted}</small>
                        </div>
                        <div class="estrellas" role="img" aria-label="${r.estrella} de 5 estrellas">${estrellasHtml}</div>
                    </header>
                    <p class="resena-texto ${r.comentario ? '' : 'vacio'}">${escaparHTML(r.comentario || 'Sin comentario escrito.')}</p>
                    <footer class="resena-acciones">
                        <button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalEditarResena(${r.servicio_id}, ${r.tecnico_id}, ${r.estrella}, '${comentarioEnc}')">
                            <i data-lucide="edit-2"></i> Editar
                        </button>
                        <button type="button" class="btn btn-danger-ghost btn-sm" onclick="eliminarResenaHistorial(${r.id})">
                            <i data-lucide="trash-2"></i> Eliminar
                        </button>
                    </footer>
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

            Swal.fire({
                icon: 'success',
                title: 'Reseña actualizada',
                text: 'La reseña fue guardada exitosamente.',
                timer: 1800,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar la reseña.'
            });
        }
    } catch (error) {
        console.error("Error al guardar reseña:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Ocurrió un problema al guardar la reseña.'
        });
    }
};

window.eliminarResenaHistorial = async function(resenaId) {
    const result = await Swal.fire({
        title: '¿Eliminar reseña?',
        text: 'Esta acción eliminará la calificación del técnico permanentemente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`${BASE_URL}/api/resenas/${resenaId}?cliente_id=${usuarioActual.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await cargarHistorialResenas(usuarioActual.id);
            Swal.fire({
                icon: 'success',
                title: 'Reseña eliminada',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar la reseña.'
            });
        }
    } catch (error) {
        console.error("Error al eliminar reseña:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Ocurrió un error al intentar eliminar la reseña.'
        });
    }
};