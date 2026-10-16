const BASE_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById("contenedor-pedidos");
    const usuarioGuardado = localStorage.getItem('usuario');

    if (!usuarioGuardado) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <i data-lucide="lock"></i>
                <p>Debes iniciar sesión para ver tus pedidos.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);
    await cargarPedidosUsuario(usuario.id);
});

async function cargarPedidosUsuario(clienteId) {
    const contenedor = document.getElementById("contenedor-pedidos");
    contenedor.innerHTML = '<p class="text-center" style="padding: 20px; color: var(--muted);">Cargando tus solicitudes...</p>';

    try {
        const response = await fetch(`${BASE_URL}/api/pedidos/usuario/${clienteId}`);
        const data = await response.json();

        if (!response.ok) {
            contenedor.innerHTML = `<p class="text-center" style="color: red; padding: 20px;">${data.error || 'Error al obtener pedidos'}</p>`;
            return;
        }

        const pedidos = data.payload || data || [];

        if (pedidos.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox"></i>
                    <p>Aún no tienes solicitudes de servicio registradas.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Orden de prioridad de los estados: Confirmados -> Pendientes -> Cancelados -> Finalizados
        const ordenEstados = {
            'confirmado': 1,
            'pendiente': 2,
            'en_proceso': 3,
            'cancelado': 4,
            'rechazado': 5,
            'finalizado': 6,
            'completado': 7
        };

        pedidos.sort((a, b) => {
            const pesoA = ordenEstados[String(a.Estado).toLowerCase()] || 99;
            const pesoB = ordenEstados[String(b.Estado).toLowerCase()] || 99;
            return pesoA - pesoB;
        });

        contenedor.innerHTML = '';
        pedidos.forEach(pedido => {
            contenedor.innerHTML += generarTarjetaPedidoHTML(pedido);
        });

        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        contenedor.innerHTML = '<p class="text-center" style="color: red; padding: 20px;">No se pudo conectar con el servidor.</p>';
    }
}

function generarTarjetaPedidoHTML(pedido) {
    const estado = String(pedido.Estado || 'pendiente').toLowerCase();
    
    const configuracionEstado = {
        'confirmado': { clase: 'badge-confirmed', label: 'Confirmado', icono: 'check-circle' },
        'pendiente': { clase: 'badge-pending', label: 'Pendiente', icono: 'clock' },
        'en_proceso': { clase: 'badge-progress', label: 'En Proceso', icono: 'loader' },
        'cancelado': { clase: 'badge-canceled', label: 'Cancelado', icono: 'x-circle' },
        'rechazado': { clase: 'badge-canceled', label: 'Rechazado', icono: 'x-circle' },
        'finalizado': { clase: 'badge-finished', label: 'Finalizado', icono: 'check-check' },
        'completado': { clase: 'badge-finished', label: 'Completado', icono: 'check-check' }
    };

    const config = configuracionEstado[estado] || { clase: 'badge-pending', label: estado, icono: 'info' };

    // Formatear Iniciales
    const nombreReal = pedido.tecnico_nombre || '';
    const apellido = pedido.tecnico_apellido || '';
    const iniciales = (nombreReal && apellido) 
        ? `${nombreReal[0]}${apellido[0]}`.toUpperCase() 
        : 'TC';

    // Formatear Fecha (DD/MM/YYYY)
    let fechaFormateada = 'Sin fecha';
    if (pedido.fecha_servicio) {
        const partes = String(pedido.fecha_servicio).split('T')[0].split('-');
        if (partes.length === 3) {
            fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
    }

    const horaFormateada = pedido.hora_servicio ? String(pedido.hora_servicio).substring(0, 5) : '--:--';
    const tecnicoNombre = nombreReal ? `${nombreReal} ${apellido}` : 'Técnico Asignado';

    return `
        <article class="pedido-card ${estado}">
            <header class="pedido-header">
                <div class="tech-info">
                    <div class="tech-avatar-box">${iniciales}</div>
                    <div class="tech-text-info">
                        <h4>${tecnicoNombre}</h4>
                        <small>${pedido.tecnico_categoria || 'Servicio Técnico'}</small>
                    </div>
                </div>
                <span class="status-badge ${config.clase}">
                    <i data-lucide="${config.icono}"></i> ${config.label}
                </span>
            </header>

            <p class="pedido-desc">${pedido.descripcion || 'Sin descripción detallada.'}</p>

            <div class="pedido-details-grid">
                <div class="detail-group">
                    <div class="detail-row">
                        <i data-lucide="calendar"></i>
                        <span>${fechaFormateada}</span>
                    </div>
                    <div class="detail-row">
                        <i data-lucide="clock"></i>
                        <span>${horaFormateada} hs</span>
                    </div>
                </div>
                <div class="detail-row">
                    <i data-lucide="map-pin"></i>
                    <span>${pedido.direccion || 'Dirección no especificada'}</span>
                </div>
            </div>

            <footer class="pedido-footer">
                <span class="pedido-id">#ORD-${pedido.id}</span>
                
                <div class="pedido-actions">
                    ${estado === 'pendiente' ? `
                        <button class="btn-action danger" onclick="cancelarPedido(${pedido.id})">
                            <i data-lucide="x-circle"></i> Cancelar
                        </button>
                    ` : ''}

                    ${estado === 'confirmado' ? `
                        <button class="btn-action primary" onclick="verDetalles(${pedido.id})">
                            <i data-lucide="eye"></i> Detalle
                        </button>
                    ` : ''}
                </div>
            </footer>
        </article>
    `;
}