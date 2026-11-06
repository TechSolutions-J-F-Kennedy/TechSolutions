const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501')
  ? 'http://localhost:3000'
  : '';

function esc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function obtenerIniciales(nombre, porDefecto) {
    return String(nombre || '').split(' ').filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2) || porDefecto;
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const tecnicoId = params.get('id');

    if (!tecnicoId) {
        alert("No se especificó un técnico.");
        window.location.href = 'home.html';
        return;
    }

    await cargarPerfilTecnico(tecnicoId);
});

async function cargarPerfilTecnico(tecnicoId) {
    const cardContenedor = document.getElementById('tech-profile-card');
    const reviewsContenedor = document.getElementById('reviews-container');
    const conteoResenas = document.getElementById('reviews-count');

    const usuarioGuardado = localStorage.getItem('usuario');
    let usuarioActualId = null;
    if (usuarioGuardado) {
        try {
            const usr = JSON.parse(usuarioGuardado);
            usuarioActualId = usr.id;
        } catch (e) {
            console.error("Error al leer usuario de localStorage:", e);
        }
    }

    try {
        const response = await fetch(`${BASE_URL}/api/tecnicos/perfil/${tecnicoId}`);
        const data = await response.json();

        if (!response.ok) {
            cardContenedor.innerHTML = `<p class="mensaje-lista error">${esc(data.error || 'Error al obtener el perfil')}</p>`;
            return;
        }

        const t = data.payload;

        // Datos del Técnico (sí usan nombre_real y apellido)
        const nombreTecnico = `${t.nombre_real || t.nombre || ''} ${t.apellido || ''}`.trim();
        const iniciales = (t.nombre_real && t.apellido)
            ? `${t.nombre_real[0]}${t.apellido[0]}`.toUpperCase()
            : nombreTecnico.slice(0, 2).toUpperCase();

        const promedio = parseFloat(t.reputacion_promedio);
        const tienePromedio = promedio > 0;
        const totalResenas = Number(t.total_resenas) || 0;

        const filaContacto = (icono, texto) => `
            <li class="contacto-fila">
                <span class="contacto-icono"><i data-lucide="${icono}"></i></span>
                <span>${esc(texto)}</span>
            </li>`;

        // Renderizar tarjeta del Técnico
        cardContenedor.innerHTML = `
            <div class="tecnico-top">
                <div class="tecnico-avatar">${t.foto_perfil ? `<img src="${esc(t.foto_perfil)}" alt="">` : esc(iniciales)}</div>
                <div class="tecnico-ident">
                    <h2 class="tecnico-nombre">${esc(nombreTecnico)}</h2>
                    <span class="tecnico-cat">${esc(t.categoria || 'Servicio técnico')}</span>
                </div>
            </div>

            <div class="tecnico-stats">
                <div class="tecnico-stat">
                    <span class="stat-valor"><i data-lucide="star"></i>${tienePromedio ? promedio.toFixed(1) : '—'}</span>
                    <span class="stat-label">${tienePromedio ? 'Calificación promedio' : 'Sin calificaciones'}</span>
                </div>
                <div class="tecnico-stat">
                    <span class="stat-valor">${totalResenas}</span>
                    <span class="stat-label">${totalResenas === 1 ? 'opinión' : 'opiniones'}</span>
                </div>
            </div>

            <p class="tecnico-desc ${t.descripcion ? '' : 'vacio'}">${esc(t.descripcion || 'Sin descripción disponible.')}</p>

            <ul class="tecnico-contacto">
                ${filaContacto('mail', t.email || 'No disponible')}
                ${filaContacto('phone', t.telefono || 'No disponible')}
                ${t.direccion_completa ? filaContacto('map-pin', t.direccion_completa) : ''}
            </ul>
        `;

        // Renderizar Lista de Reseñas
        let resenas = t.resenas || [];
        if (conteoResenas) conteoResenas.textContent = resenas.length;

        if (resenas.length === 0) {
            reviewsContenedor.innerHTML = '<p class="mensaje-lista">Aún no cuenta con opiniones de clientes.</p>';
        } else {
            // Priorizar la reseña del usuario logueado en la primera posición
            if (usuarioActualId) {
                resenas.sort((a, b) => {
                    if (a.cliente_id === usuarioActualId) return -1;
                    if (b.cliente_id === usuarioActualId) return 1;
                    return 0;
                });
            }

            reviewsContenedor.innerHTML = resenas.map(r => {
                const esMiResena = usuarioActualId && (r.cliente_id === usuarioActualId);
                const nombreCliente = r.cliente_nombre || 'Cliente';

                let estrellasHtml = '';
                for (let i = 1; i <= 5; i++) {
                    estrellasHtml += `<i data-lucide="star" class="${i <= r.estrella ? 'on' : ''}"></i>`;
                }

                let fechaFormateada = '';
                if (r.fecha) {
                    const partes = String(r.fecha).split('T')[0].split('-');
                    if (partes.length === 3) fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }

                return `
                    <article class="resena-card ${esMiResena ? 'mia' : ''}">
                        <header class="resena-head">
                            <div class="resena-avatar">${esc(obtenerIniciales(nombreCliente, 'CL'))}</div>
                            <div class="resena-quien">
                                <span class="resena-nombre">
                                    <strong>${esc(nombreCliente)}</strong>
                                    ${esMiResena ? '<span class="resena-tag">Tu reseña</span>' : ''}
                                </span>
                                <small>${fechaFormateada}</small>
                            </div>
                            <div class="estrellas" role="img" aria-label="${esc(r.estrella)} de 5 estrellas">${estrellasHtml}</div>
                        </header>
                        ${r.comentario ? `<p class="resena-texto">${esc(r.comentario)}</p>` : ''}
                    </article>
                `;
            }).join('');
        }

        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Error al cargar perfil:", error);
        cardContenedor.innerHTML = '<p class="mensaje-lista error">Error al conectar con el servidor.</p>';
    }
}
