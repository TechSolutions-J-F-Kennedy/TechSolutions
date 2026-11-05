const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501')
  ? 'http://localhost:3000'
  : '';

// Variables globales de estado y selección
let filtroEstadoActual = 'todos';
let reprogTecnicoId = null;
let reprogFechaSeleccionada = null;
let reprogHoraSeleccionada = null;

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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
        console.warn("Modal de alerta no encontrado:", mensaje);
    }
};

window.cerrarAlertaPersonalizada = function() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        modal.classList.remove('active-modal');
        modal.style.setProperty('display', 'none', 'important');
    }
};

// -------------------------------------------------------------
// FUNCIONES AUXILIARES
// -------------------------------------------------------------

function esc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatearFechaHora(fechaRaw, horaRaw) {
    let fechaFormateada = 'Sin fecha';
    let horaFormateada = '--:--';

    if (fechaRaw) {
        const fechaObj = new Date(fechaRaw);
        if (!isNaN(fechaObj.getTime())) {
            const dia = String(fechaObj.getUTCDate()).padStart(2, '0');
            const mes = String(fechaObj.getUTCMonth() + 1).padStart(2, '0');
            const anio = fechaObj.getUTCFullYear();
            fechaFormateada = `${dia}/${mes}/${anio}`;
        } else {
            const partes = String(fechaRaw).split('T')[0].split('-');
            if (partes.length === 3) {
                fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
        }
    }

    if (horaRaw) {
        horaFormateada = String(horaRaw).substring(0, 5);
    }

    return { fechaFormateada, horaFormateada };
}

function obtenerPartesFecha(fechaRaw) {
    if (!fechaRaw) return null;

    const m = String(fechaRaw).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
        return { dia: parseInt(m[3], 10), mes: parseInt(m[2], 10) - 1, anio: parseInt(m[1], 10) };
    }

    const d = new Date(fechaRaw);
    if (isNaN(d.getTime())) return null;
    return { dia: d.getUTCDate(), mes: d.getUTCMonth(), anio: d.getUTCFullYear() };
}

function esPedidoVencido(pedido) {
    if (!pedido.fecha_servicio || !pedido.hora_servicio) return false;

    const fechaLimpia = String(pedido.fecha_servicio).split('T')[0];
    const partesFecha = fechaLimpia.split('-');
    const partesHora = String(pedido.hora_servicio).substring(0, 5).split(':');

    if (partesFecha.length !== 3 || partesHora.length !== 2) return false;

    const anio = parseInt(partesFecha[0]);
    const mes = parseInt(partesFecha[1]) - 1;
    const dia = parseInt(partesFecha[2]);
    const hora = parseInt(partesHora[0]);
    const minuto = parseInt(partesHora[1]);

    const fechaHoraTurno = new Date(anio, mes, dia, hora, minuto, 0);
    const ahora = new Date();

    const diferenciaMs = ahora - fechaHoraTurno;
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    return diferenciaHoras >= 4;
}

function normalizarEstadoFiltro(estado) {
    if (estado === 'completado') return 'finalizado';
    if (estado === 'rechazado') return 'cancelado';
    return estado;
}

function claveFecha(pedido) {
    const fecha = String(pedido.fecha_servicio || '').split('T')[0];
    const hora = String(pedido.hora_servicio || '').substring(0, 5);
    return `${fecha} ${hora}`;
}

// -------------------------------------------------------------
// MODALES (Control de visibilidad)
// -------------------------------------------------------------

function abrirModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return false;
    modal.classList.add('active-modal');
    if (window.lucide) lucide.createIcons();
    return true;
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active-modal');
}

window.cerrarModalResena = function() {
    cerrarModal('modal-resena');
};

window.abrirModalResena = function(pedidoId, tecnicoId, estrellaExistente = 5, comentarioExistente = '') {
    const modal = document.getElementById('modal-resena');
    if (!modal) return mostrarAlerta("Error: No se encontró el modal de reseñas en la página.", "Error");

    document.getElementById('resena-pedido-id').value = pedidoId;
    document.getElementById('resena-tecnico-id').value = tecnicoId || 0;
    document.getElementById('resena-comentario').value = comentarioExistente;

    const tituloModal = modal.querySelector('h3');
    if (tituloModal) {
        tituloModal.textContent = (comentarioExistente || estrellaExistente < 5) ? 'Editar reseña' : 'Calificar servicio';
    }

    abrirModal('modal-resena');
    setEstrellasUI(parseInt(estrellaExistente) || 5);
};

// -------------------------------------------------------------
// MODAL RESOLUCIÓN Y REPROGRAMACIÓN
// -------------------------------------------------------------

function mostrarModalResolucion(pedido) {
    const spanId = document.getElementById('res-pedido-id');
    const inputId = document.getElementById('res-pedido-id-input');

    if (spanId) spanId.textContent = `#ORD-${pedido.id}`;
    if (inputId) inputId.value = pedido.id;

    abrirModal('modal-resolucion');
}

window.resolverPedidoAccion = async function(nuevoEstado) {
    const pedidoId = document.getElementById('res-pedido-id-input').value;

    try {
        const response = await fetch(`${BASE_URL}/api/pedidos/${pedidoId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (response.ok) {
            cerrarModal('modal-resolucion');

            const usuarioObj = JSON.parse(localStorage.getItem('usuario'));
            await cargarPedidosUsuario(usuarioObj.id);
        } else {
            mostrarAlerta("No se pudo actualizar el estado del pedido.", "Error");
        }
    } catch (err) {
        console.error("Error al resolver pedido:", err);
        mostrarAlerta("Error de conexión al actualizar el pedido.", "Error de Red");
    }
};

window.abrirModalReprogramar = function() {
    const pedidoId = document.getElementById('res-pedido-id-input')?.value;
    const pedidoActual = window.listaPedidosActuales?.find(p => String(p.id) === String(pedidoId));

    if (pedidoActual) {
        reprogTecnicoId = pedidoActual.tecnico_id;
    }

    cerrarModal('modal-resolucion');

    if (abrirModal('modal-reprogramar')) {
        generarDiasCarruselReprogramar();
    }
};

window.cerrarModalReprogramar = function() {
    cerrarModal('modal-reprogramar');
};

function generarDiasCarruselReprogramar() {
    const container = document.getElementById('reprog-days-carousel');
    const monthLabel = document.getElementById('reprog-month-label');
    if (!container) return;
    container.innerHTML = '';

    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();

    if (monthLabel) {
        monthLabel.textContent = `${nombresMeses[hoy.getMonth()]} ${hoy.getFullYear()}`;
    }

    for (let i = 0; i < 7; i++) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() + i);

        const diaNombre = diasSemana[fecha.getDay()];
        const diaNum = fecha.getDate();

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const fechaISO = `${anio}-${mes}-${dia}`;

        const dayCard = document.createElement('button');
        dayCard.type = 'button';
        dayCard.className = `day-card ${i === 0 ? 'selected' : ''}`;
        dayCard.innerHTML = `
            <span class="day-name">${i === 0 ? 'Hoy' : diaNombre}</span>
            <span class="day-num">${diaNum}</span>
        `;

        dayCard.onclick = () => {
            container.querySelectorAll('.day-card').forEach(c => c.classList.remove('selected'));
            dayCard.classList.add('selected');

            reprogFechaSeleccionada = fechaISO;
            cargarHorariosBackendReprogramar(fechaISO);
        };

        container.appendChild(dayCard);
    }

    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    reprogFechaSeleccionada = `${anio}-${mes}-${dia}`;

    cargarHorariosBackendReprogramar(reprogFechaSeleccionada);
}

async function cargarHorariosBackendReprogramar(fecha) {
    const grid = document.getElementById('reprog-time-grid');
    if (!grid) return;

    grid.innerHTML = '<p class="grid-msg">Cargando disponibilidad...</p>';
    reprogHoraSeleccionada = null;
    validarFormularioReprogramar();

    try {
        const url = reprogTecnicoId
            ? `${BASE_URL}/api/tecnicos/${reprogTecnicoId}/disponibilidad?fecha=${fecha}`
            : null;

        if (!url) {
            grid.innerHTML = '<p class="grid-msg error">No se identificó al técnico.</p>';
            return;
        }

        const res = await fetch(url);
        const data = await res.json();

        grid.innerHTML = '';

        if (!res.ok) {
            grid.innerHTML = `<p class="grid-msg error">${esc(data.error || 'Error al cargar horarios')}</p>`;
            return;
        }

        if (!data.slots || data.slots.length === 0) {
            grid.innerHTML = '<p class="grid-msg">Sin turnos configurados para este día.</p>';
            return;
        }

        data.slots.forEach(slot => {
            const timeBtn = document.createElement('button');
            timeBtn.type = 'button';
            timeBtn.className = 'time-chip';
            timeBtn.textContent = slot.hora;
            timeBtn.disabled = !!slot.ocupado;

            if (!slot.ocupado) {
                timeBtn.onclick = () => {
                    grid.querySelectorAll('.time-chip').forEach(t => t.classList.remove('selected'));
                    timeBtn.classList.add('selected');
                    reprogHoraSeleccionada = slot.hora;
                    validarFormularioReprogramar();
                };
            }

            grid.appendChild(timeBtn);
        });

    } catch (error) {
        console.error('Error al obtener horarios de reprogramación:', error);
        grid.innerHTML = '<p class="grid-msg error">Error al conectar con el servidor.</p>';
    }
}

function validarFormularioReprogramar() {
    const btnSubmit = document.getElementById('btn-confirm-reprogramar');
    if (btnSubmit) {
        btnSubmit.disabled = !(reprogFechaSeleccionada && reprogHoraSeleccionada);
    }
}

window.guardarNuevaFecha = async function() {
    const pedidoId = document.getElementById('res-pedido-id-input')?.value;

    if (!pedidoId || !reprogFechaSeleccionada || !reprogHoraSeleccionada) return;

    try {
        const response = await fetch(`${BASE_URL}/api/pedidos/${pedidoId}/reprogramar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fecha_servicio: reprogFechaSeleccionada,
                hora_servicio: reprogHoraSeleccionada
            })
        });

        if (response.ok) {
            window.cerrarModalReprogramar();
            const usuarioObj = JSON.parse(localStorage.getItem('usuario'));
            await cargarPedidosUsuario(usuarioObj.id);
            mostrarAlerta("Cita reprogramada correctamente.", "Éxito");
        } else {
            mostrarAlerta("Error al reprogramar la cita.", "Error");
        }
    } catch (err) {
        console.error("Error al reprogramar pedido:", err);
        mostrarAlerta("Error al conectar con el servidor.", "Error de Red");
    }
};

// -------------------------------------------------------------
// CICLO DE VIDA Y RENDERIZADO DE LA PÁGINA
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById("contenedor-pedidos");
    const usuarioGuardado = localStorage.getItem('usuario');

    if (!usuarioGuardado) {
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="lock"></i>
                    <p>Iniciá sesión para ver tus pedidos.</p>
                </div>
            `;
        }
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Chips de filtro por estado
    const filterChips = document.querySelectorAll('.chip-filter');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            filtroEstadoActual = chip.dataset.filter || 'todos';

            if (window.listaPedidosActuales) {
                renderizarListaPedidos(window.listaPedidosActuales);
            }
        });
    });

    // Cerrar modales al tocar el fondo overlay
    ['modal-resena', 'modal-reprogramar', 'custom-alert-modal'].forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (id === 'custom-alert-modal') cerrarAlertaPersonalizada();
                    else cerrarModal(id);
                }
            });
        }
    });

    const usuario = JSON.parse(usuarioGuardado);
    await cargarPedidosUsuario(usuario.id);

    if (contenedor) {
        contenedor.addEventListener('click', (e) => {
            const btnCalificar = e.target.closest('.btn-calificar');
            if (btnCalificar) {
                e.preventDefault();
                const pedidoId = btnCalificar.getAttribute('data-pedido-id');
                const tecnicoId = btnCalificar.getAttribute('data-tecnico-id');
                const estrella = btnCalificar.getAttribute('data-estrella') || 5;
                const comentario = btnCalificar.getAttribute('data-comentario') || '';

                window.abrirModalResena(pedidoId, tecnicoId, estrella, comentario);
                return;
            }

            const btnCancelar = e.target.closest('.btn-cancelar');
            if (btnCancelar) {
                e.preventDefault();
                const pedidoId = btnCancelar.getAttribute('data-pedido-id');
                cancelarPedido(pedidoId);
                return;
            }
        });
    }

    const formResena = document.getElementById('form-resena');
    if (formResena) {
        formResena.addEventListener('submit', enviarResena);
    }
});

async function cargarPedidosUsuario(clienteId) {
    const contenedor = document.getElementById("contenedor-pedidos");
    if (!contenedor) return;

    contenedor.innerHTML = '<p class="mensaje-lista">Cargando tus solicitudes...</p>';

    try {
        const response = await fetch(`${BASE_URL}/api/pedidos/usuario/${clienteId}`);
        const data = await response.json();

        if (!response.ok) {
            contenedor.innerHTML = `<p class="mensaje-lista error">${esc(data.error || 'Error al obtener pedidos')}</p>`;
            return;
        }

        const pedidos = data.payload || data || [];
        window.listaPedidosActuales = pedidos;
        actualizarContadoresFiltros(pedidos);

        if (pedidos.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox"></i>
                    <p>Todavía no tenés solicitudes de servicio.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        const pedidoVencido = pedidos.find(p => String(p.Estado).toLowerCase() === 'pendiente' && esPedidoVencido(p));
        if (pedidoVencido) {
            mostrarModalResolucion(pedidoVencido);
        }

        renderizarListaPedidos(pedidos);

    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        contenedor.innerHTML = '<p class="mensaje-lista error">No se pudo conectar con el servidor.</p>';
    }
}

function actualizarContadoresFiltros(pedidos) {
    const cuentas = { todos: pedidos.length };

    pedidos.forEach(p => {
        const est = normalizarEstadoFiltro(String(p.Estado || '').toLowerCase());
        cuentas[est] = (cuentas[est] || 0) + 1;
    });

    document.querySelectorAll('.chip-filter').forEach(chip => {
        let contador = chip.querySelector('.chip-count');
        if (!contador) {
            contador = document.createElement('span');
            contador.className = 'chip-count';
            chip.appendChild(contador);
        }
        contador.textContent = cuentas[chip.dataset.filter] || 0;
    });
}

function renderizarListaPedidos(pedidos) {
    const contenedor = document.getElementById("contenedor-pedidos");
    if (!contenedor) return;

    let pedidosFiltrados = [...pedidos];
    if (filtroEstadoActual !== 'todos') {
        pedidosFiltrados = pedidosFiltrados.filter(p =>
            normalizarEstadoFiltro(String(p.Estado || '').toLowerCase()) === filtroEstadoActual
        );
    }

    if (pedidosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox"></i>
                <p>No tenés solicitudes con este estado.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const ordenEstados = {
        'confirmado': 1,
        'pendiente': 2,
        'en_proceso': 3,
        'cancelado': 4,
        'rechazado': 5,
        'finalizado': 6,
        'completado': 7
    };

    pedidosFiltrados.sort((a, b) => {
        const estA = String(a.Estado).toLowerCase();
        const estB = String(b.Estado).toLowerCase();
        const pesoA = ordenEstados[estA] || 99;
        const pesoB = ordenEstados[estB] || 99;
        if (pesoA !== pesoB) return pesoA - pesoB;

        const cerrado = pesoA >= 4 && pesoA !== 99;
        const cmp = claveFecha(a).localeCompare(claveFecha(b));
        return cerrado ? -cmp : cmp;
    });

    contenedor.innerHTML = pedidosFiltrados.map(generarTarjetaPedidoHTML).join('');

    if (window.lucide) lucide.createIcons();
}

function generarTarjetaPedidoHTML(pedido) {
    const estado = String(pedido.Estado || 'pendiente').toLowerCase();

    const configuracionEstado = {
        'confirmado': { label: 'Confirmado', icono: 'check-circle' },
        'pendiente': { label: 'Pendiente', icono: 'clock' },
        'en_proceso': { label: 'En proceso', icono: 'loader' },
        'cancelado': { label: 'Cancelado', icono: 'x-circle' },
        'rechazado': { label: 'Rechazado', icono: 'x-circle' },
        'finalizado': { label: 'Finalizado', icono: 'check-check' },
        'completado': { label: 'Completado', icono: 'check-check' }
    };

    const config = configuracionEstado[estado] || { label: estado, icono: 'info' };

    const nombreReal = pedido.tecnico_nombre || '';
    const apellido = pedido.tecnico_apellido || '';
    const iniciales = (nombreReal && apellido)
        ? `${nombreReal[0]}${apellido[0]}`.toUpperCase()
        : 'TC';

    const { fechaFormateada, horaFormateada } = formatearFechaHora(pedido.fecha_servicio, pedido.hora_servicio);
    const partesFecha = obtenerPartesFecha(pedido.fecha_servicio);
    const diaTxt = partesFecha ? partesFecha.dia : '--';
    const mesTxt = partesFecha ? MESES_CORTOS[partesFecha.mes] : '';

    const tecnicoNombre = nombreReal ? `${nombreReal} ${apellido}` : 'Técnico asignado';
    const idTecnico = pedido.tecnico_id || 0;

    const tagTecnico = idTecnico ? 'a' : 'div';
    const attrsTecnico = idTecnico
        ? `href="tecnico-datos.html?id=${encodeURIComponent(idTecnico)}" aria-label="Ver perfil de ${esc(tecnicoNombre)}"`
        : '';

    const permiteResena = (estado === 'finalizado' || estado === 'completado' || estado === 'cancelado');

    let bloqueResena = '';
    if (pedido.resena_id) {
        let htmlEstrellas = '';
        for (let i = 1; i <= 5; i++) {
            htmlEstrellas += `<i data-lucide="star" class="${i <= pedido.resena_estrella ? 'on' : ''}"></i>`;
        }
        bloqueResena = `
            <div class="pedido-resena">
                <div class="pedido-resena-head">
                    <span>Tu calificación</span>
                    <div class="estrellas">${htmlEstrellas}</div>
                </div>
                ${pedido.resena_comentario ? `<p>"${esc(pedido.resena_comentario)}"</p>` : ''}
            </div>
        `;
    }

    let acciones = '';

    if (estado === 'pendiente') {
        acciones += `
            <button type="button" class="btn-action danger btn-cancelar" data-pedido-id="${esc(pedido.id)}">
                <i data-lucide="x-circle"></i> Cancelar
            </button>
        `;
    }

    if (estado === 'confirmado') {
        acciones += `
            <button type="button" class="btn-action primary" onclick="verDetalles(${esc(pedido.id)})">
                <i data-lucide="eye"></i> Ver detalle
            </button>
        `;
    }

    if (permiteResena) {
        const editando = !!pedido.resena_id;
        acciones += `
            <button type="button" class="btn-action ${editando ? 'warn' : 'success'} btn-calificar"
                    data-pedido-id="${esc(pedido.id)}"
                    data-tecnico-id="${esc(idTecnico)}"
                    data-estrella="${editando ? esc(pedido.resena_estrella) : 5}"
                    data-comentario="${editando ? esc(pedido.resena_comentario || '') : ''}">
                <i data-lucide="${editando ? 'pencil' : 'star'}"></i> ${editando ? 'Editar reseña' : 'Calificar'}
            </button>
        `;
    }

    return `
        <article class="pedido-card ${esc(estado)}">
            <div class="pedido-head">
                <span class="status-badge">
                    <i data-lucide="${config.icono}"></i> ${esc(config.label)}
                </span>
                <span class="pedido-id">#ORD-${esc(pedido.id)}</span>
            </div>

            <div class="pedido-fecha" title="${esc(fechaFormateada)} ${esc(horaFormateada)} hs">
                <span class="pf-dia">${diaTxt}</span>
                <span class="pf-mes">${mesTxt}</span>
                <span class="pf-hora">${esc(horaFormateada)}</span>
            </div>

            <div class="pedido-main">
                <${tagTecnico} class="tech-info" ${attrsTecnico}>
                    <div class="tech-avatar-box">${esc(iniciales)}</div>
                    <div class="tech-text-info">
                        <h4>${esc(tecnicoNombre)}</h4>
                        <small>${esc(pedido.tecnico_categoria || 'Servicio técnico')}</small>
                    </div>
                </${tagTecnico}>

                <p class="pedido-desc">${esc(pedido.descripcion || 'Sin descripción detallada.')}</p>

                <p class="pedido-lugar">
                    <i data-lucide="map-pin"></i>
                    <span>${esc(pedido.direccion || 'Dirección no especificada')}</span>
                </p>
            </div>

            ${bloqueResena}

            ${acciones ? `<footer class="pedido-footer">${acciones}</footer>` : ''}
        </article>
    `;
}

function setEstrellasUI(valor) {
    const inputEstrella = document.getElementById('resena-estrella');
    if (inputEstrella) inputEstrella.value = valor;

    document.querySelectorAll('.stars-selector .star-btn').forEach((star, idx) => {
        star.classList.toggle('on', idx < valor);
    });
}

document.addEventListener('click', (e) => {
    const starBtn = e.target.closest('.star-btn');
    const modal = document.getElementById('modal-resena');

    if (starBtn && modal && modal.contains(starBtn)) {
        const val = parseInt(starBtn.getAttribute('data-val') || 5);
        setEstrellasUI(val);
    }
});

async function enviarResena(event) {
    event.preventDefault();

    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) return mostrarAlerta("Debes iniciar sesión para calificar.", "Sesión requerida");

    const usuario = JSON.parse(usuarioGuardado);
    const servicio_id = document.getElementById('resena-pedido-id').value;
    const tecnico_id = document.getElementById('resena-tecnico-id').value;
    const estrella = document.getElementById('resena-estrella').value;
    const comentario = document.getElementById('resena-comentario').value.trim();

    try {
        const response = await fetch(`${BASE_URL}/api/resenas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                servicio_id: parseInt(servicio_id),
                cliente_id: usuario.id,
                tecnico_id: parseInt(tecnico_id),
                estrella: parseInt(estrella),
                comentario
            })
        });

        const data = await response.json();

        if (response.ok) {
            window.cerrarModalResena();
            await cargarPedidosUsuario(usuario.id);
            mostrarAlerta("¡Muchas gracias! Tu reseña ha sido guardada.", "Reseña Enviada");
        } else {
            mostrarAlerta(data.error || "No se pudo registrar la reseña.", "Error");
        }
    } catch (error) {
        console.error("Error al enviar reseña:", error);
        mostrarAlerta("Error al conectar con el servidor.", "Error de Red");
    }
}

async function cancelarPedido(pedidoId) {
    // Abrimos el modal personalizado directamente para confirmar la acción
    // aprovechando que el usuario presiona Cancelar.
    mostrarAlerta("¿Estás seguro de que deseas cancelar este pedido? Presiona 'Aceptar' para confirmar.", "Confirmar Cancelación");
    
    // Obtenemos el botón de aceptar del modal para asignarle la ejecución de la cancelación
    const btnAceptarModal = document.querySelector('#custom-alert-modal button');
    
    if (btnAceptarModal) {
        // Asignamos un eventListener temporal para ejecutar la petición al confirmar
        const ejecutarCancelacion = async () => {
            btnAceptarModal.removeEventListener('click', ejecutarCancelacion);
            
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
                    mostrarAlerta("El pedido ha sido cancelado con éxito.", "Pedido Cancelado");
                } else {
                    mostrarAlerta(data.error || "No se pudo cancelar el pedido.", "Error");
                }
            } catch (error) {
                console.error("Error al cancelar pedido:", error);
                mostrarAlerta("Error al conectar con el servidor.", "Error de Red");
            }
        };

        btnAceptarModal.addEventListener('click', ejecutarCancelacion, { once: true });
    }
}