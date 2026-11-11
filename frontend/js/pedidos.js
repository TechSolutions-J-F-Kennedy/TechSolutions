const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500')
  ? 'http://localhost:3000'
  : '';

let pedidosActuales = [];

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
        pedidosActuales = pedidos;

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

                    ${(estado === 'finalizado' || estado === 'completado') ? `
                        <button class="btn-action primary" onclick="abrirModalComprobante(${pedido.id})" style="background:#16a34a; border-color:#16a34a; color:#fff;">
                            <i data-lucide="receipt"></i> Recibo
                        </button>
                        <button class="btn-action secondary" onclick="abrirModalResena(${pedido.id})">
                            <i data-lucide="star"></i> Calificar
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


async function cancelarPedido(pedidoId) {
    const confirmacion = confirm("¿Estás seguro de que deseas cancelar este pedido?");
    if (!confirmacion) return;

    try {
        const response = await fetch(`${BASE_URL}/api/pedidos/${pedidoId}/cancelar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
            
            const usuarioGuardado = localStorage.getItem('usuario');
            if (usuarioGuardado) {
                const usuario = JSON.parse(usuarioGuardado);
                await cargarPedidosUsuario(usuario.id);
            }
        } else {
            alert(data.error || "No se pudo cancelar el pedido.");
        }
    } catch (error) {
        console.error("Error al cancelar pedido:", error);
        alert("Error al conectar con el servidor.");
    }
}

// ================= MODAL CALIFICACIÓN / RESEÑA =================
function abrirModalResena(pedidoId) {
    const modal = document.getElementById('modal-resena');
    if (!modal) return;
    document.getElementById('resena-pedido-id').value = pedidoId;
    document.getElementById('resena-comentario').value = '';
    seleccionarEstrellas(5);
    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
}

function cerrarModalResena() {
    const modal = document.getElementById('modal-resena');
    if (modal) modal.style.display = 'none';
}

function seleccionarEstrellas(n) {
    document.getElementById('resena-estrella').value = n;
    const estrellas = document.querySelectorAll('#estrellas-selector span');
    estrellas.forEach((span, i) => {
        span.style.opacity = i < n ? '1' : '0.25';
    });
}

document.addEventListener('click', (e) => {
    const span = e.target.closest('#estrellas-selector span');
    if (span) {
        seleccionarEstrellas(Number(span.dataset.star));
    }
});

async function enviarResena(e) {
    e.preventDefault();
    const pedidoId = document.getElementById('resena-pedido-id').value;
    const estrella = Number(document.getElementById('resena-estrella').value);
    const comentario = document.getElementById('resena-comentario').value.trim();

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (!usuario.id) {
        alert('Tenés que iniciar sesión.');
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/clientes/${usuario.id}/resenas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                servicio_id: Number(pedidoId),
                estrella,
                comentario
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert('¡Gracias por calificar el servicio!');
            cerrarModalResena();
            await cargarPedidosUsuario(usuario.id);
        } else {
            alert(data.error || 'No se pudo enviar la calificación.');
        }
    } catch (err) {
        console.error('Error al enviar reseña:', err);
        alert('Error de conexión al enviar la calificación.');
    }
}

// ================= MODAL COMPROBANTE SIMULADO =================
function abrirModalComprobante(pedidoId) {
    const pedido = pedidosActuales.find((p) => Number(p.id) === Number(pedidoId));
    const modal = document.getElementById('modal-comprobante');
    if (!modal) return;

    const nombreReal = pedido?.tecnico_nombre || '';
    const apellido = pedido?.tecnico_apellido || '';
    const tecnicoNombre = nombreReal ? `${nombreReal} ${apellido}` : 'Técnico Asignado';

    let fechaFormateada = 'Hoy';
    if (pedido?.fecha_servicio) {
        const partes = String(pedido.fecha_servicio).split('T')[0].split('-');
        if (partes.length === 3) fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    document.getElementById('comprobante-id').textContent = `#ORD-${pedidoId}`;
    document.getElementById('comprobante-tecnico').textContent = tecnicoNombre;
    document.getElementById('comprobante-fecha').textContent = fechaFormateada;
    document.getElementById('comprobante-desc').textContent = pedido?.descripcion || 'Servicio de asistencia técnica';
    
    // Costo simulado
    const costoSimulado = pedido?.costo_total ? `$${Number(pedido.costo_total).toLocaleString('es-AR')}` : '$18.500';
    document.getElementById('comprobante-monto').textContent = costoSimulado;

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
}

function cerrarModalComprobante() {
    const modal = document.getElementById('modal-comprobante');
    if (modal) modal.style.display = 'none';
}