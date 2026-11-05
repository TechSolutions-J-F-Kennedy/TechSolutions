const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501')
  ? 'http://localhost:3000'
  : '';

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
            cardContenedor.innerHTML = `<p style="color: red; padding: 20px;">${data.error || 'Error al obtener el perfil'}</p>`;
            return;
        }

        const t = data.payload;
        
        // Datos del Técnico (sí usan nombre_real y apellido)
        const nombreTecnico = `${t.nombre_real || t.nombre || ''} ${t.apellido || ''}`.trim();
        const iniciales = (t.nombre_real && t.apellido) 
            ? `${t.nombre_real[0]}${t.apellido[0]}`.toUpperCase() 
            : nombreTecnico.slice(0, 2).toUpperCase();

        const promedio = (t.reputacion_promedio && parseFloat(t.reputacion_promedio) > 0)
            ? parseFloat(t.reputacion_promedio).toFixed(1)
            : 'Sin calificaciones';

        // Renderizar tarjeta del Técnico
        cardContenedor.innerHTML = `
            <div class="tech-avatar-box" style="width: 80px; height: 80px; margin: 0 auto 12px auto; font-size: 1.8rem; border-radius: 50%; background: var(--primary-color, #e63946); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                ${t.foto_perfil ? `<img src="${t.foto_perfil}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : iniciales}
            </div>
            <h2 style="margin: 0 0 4px 0;">${nombreTecnico}</h2>
            <small style="color: var(--muted); font-size: 0.9rem;">${t.categoria || 'Servicio Técnico'}</small>
            
            <div style="display: flex; justify-content: center; align-items: center; gap: 6px; margin: 14px 0;">
                <i data-lucide="star" style="fill: #ffc107; color: #ffc107; width: 22px; height: 22px;"></i>
                <strong style="font-size: 1.3rem;">${promedio}</strong>
                <span style="color: var(--muted); font-size: 0.85rem;">(${t.total_resenas || 0} opiniones)</span>
            </div>

            <p style="font-size: 0.95rem; margin-bottom: 16px; color: #ccc;">${t.descripcion || 'Sin descripción disponible.'}</p>

            <div style="font-size: 0.85rem; color: #aaa; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; text-align: left;">
                <div><i data-lucide="mail" style="width: 16px; height: 16px; vertical-align: middle;"></i> ${t.email || 'No disponible'}</div>
                <div><i data-lucide="phone" style="width: 16px; height: 16px; vertical-align: middle;"></i> ${t.telefono || 'No disponible'}</div>
                ${t.direccion_completa ? `<div><i data-lucide="map-pin" style="width: 16px; height: 16px; vertical-align: middle;"></i> ${t.direccion_completa}</div>` : ''}
            </div>
        `;

        // Renderizar Lista de Reseñas
        let resenas = t.resenas || [];

        if (resenas.length === 0) {
            reviewsContenedor.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">Aún no cuenta con opiniones de clientes.</p>';
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
                    const esDorada = i <= r.estrella;
                    estrellasHtml += `<i data-lucide="star" style="width: 14px; height: 14px; fill: ${esDorada ? '#ffc107' : 'none'}; color: ${esDorada ? '#ffc107' : '#666'};"></i>`;
                }

                let fechaFormateada = '';
                if (r.fecha) {
                    const partes = String(r.fecha).split('T')[0].split('-');
                    if (partes.length === 3) fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }

                return `
                    <div style="background: ${esMiResena ? 'rgba(230, 57, 70, 0.12)' : 'rgba(255, 255, 255, 0.05)'}; 
                                padding: 14px; 
                                border-radius: 10px; 
                                margin-bottom: 12px; 
                                border-left: 3px solid ${esMiResena ? 'var(--primary-color, #e63946)' : '#ffc107'};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <div>
                                <strong>${nombreCliente}</strong>
                                ${esMiResena ? '<span style="font-size: 0.75rem; background: var(--primary-color, #e63946); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Tu reseña</span>' : ''}
                            </div>
                            <div style="display: flex; gap: 2px;">${estrellasHtml}</div>
                        </div>
                        ${r.comentario ? `<p style="margin: 0 0 6px 0; font-size: 0.9rem; color: #ddd; font-style: italic;">"${r.comentario}"</p>` : ''}
                        <small style="color: #777; font-size: 0.75rem;">${fechaFormateada}</small>
                    </div>
                `;
            }).join('');
        }

        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Error al cargar perfil:", error);
        cardContenedor.innerHTML = '<p style="color: red; text-align: center;">Error al conectar con el servidor.</p>';
    }
}