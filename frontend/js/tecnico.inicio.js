const API_URL = location.protocol === 'file:' || location.port === '5500' ? 'http://localhost:3000' : ''; // '' = el mismo servidor que entregó la página (compu, celu o internet)

function obtenerTecnico() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        return usuario?.rol === 'tecnico' && usuario.id ? usuario : null;
    } catch (error) {
        console.error('No se pudieron leer los datos del técnico:', error);
        return null;
    }
}

const tecnico = obtenerTecnico();

if (!tecnico) {
    window.location.href = 'index.html';
} else {
    const listaPedidos = document.getElementById('lista-pedidos');
    const mensajeLista = document.getElementById('mensaje-lista');
    const panelDetalle = document.getElementById('detalle-pedido');
    const confirmacionCancelacion = document.getElementById('confirmacion-cancelacion');
    const botonConfirmarCancelacion = document.getElementById('btn-confirmar-cancelacion');
    const switchDisponible = document.getElementById('switch-disponible');
    const textoDisponibilidad = document.getElementById('switch-texto');
    let servicioSeleccionado = null;
    let servicioEnCursoId = null;

    document.getElementById('saludo').innerHTML = `Hola ${tecnico.nombre}`;

    function obtenerClaseEstado(estado) {
        const estadoNormalizado = String(estado || '').trim().toLowerCase();
        if (estadoNormalizado.includes('cancel')) return 'cancelled';
        if (estadoNormalizado.includes('final')) return 'success';
        if (estadoNormalizado.includes('proceso') || estadoNormalizado.includes('yendo')) return 'progress';
        return 'pending';
    }

    function esServicioIniciado(estado) {
        return ['en proceso', 'yendo'].includes(String(estado || '').trim().toLowerCase());
    }

    function formatearFechaHoraServicio(servicio) {
        const fechaCruda = String(servicio.fecha_servicio || '').slice(0, 10);
        const partesFecha = fechaCruda.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const fecha = partesFecha
            ? `${partesFecha[3]}/${partesFecha[2]}/${partesFecha[1]}`
            : '';
        const hora = String(servicio.hora_servicio || '').slice(0, 5);
        return [fecha, hora].filter(Boolean).join(' · ') || 'A coordinar';
    }

    function abrirDetalle(servicio) {
        servicioSeleccionado = servicio;
        panelDetalle.querySelector('[data-campo="numero"]').innerHTML = `Pedido #${servicio.id}`;
        const estado = servicio.Estado || 'No disponible';
        panelDetalle.querySelector('[data-campo="estado"]').innerHTML =
            `<span class="status ${obtenerClaseEstado(estado)}">${estado}</span>`;
        panelDetalle.querySelector('[data-campo="servicio"]').innerHTML = servicio.servicio || 'No disponible';
        panelDetalle.querySelector('[data-campo="cliente"]').innerHTML = servicio.cliente || 'No disponible';
        panelDetalle.querySelector('[data-campo="telefono"]').innerHTML = servicio.telefono || 'No disponible';
        panelDetalle.querySelector('[data-campo="ubicacion"]').innerHTML = servicio.direccion || 'No disponible';
        panelDetalle.querySelector('[data-campo="horario"]').textContent = formatearFechaHoraServicio(servicio);
        panelDetalle.querySelector('[data-campo="materiales"]').innerHTML = servicio.materiales || 'No disponible';
        panelDetalle.querySelector('[data-campo="descripcion"]').innerHTML = servicio.descripcion || 'No disponible';
        const botonAtender = document.getElementById('btn-atender');
        const avisoServicioEnCurso = document.getElementById('aviso-servicio-en-curso');
        const otroServicioEnCurso = servicioEnCursoId !== null &&
            String(servicioEnCursoId) !== String(servicio.id);
        botonAtender.href = `pedido_actual.html?id=${encodeURIComponent(servicio.id)}`;
        botonAtender.setAttribute('aria-disabled', String(otroServicioEnCurso));
        botonAtender.classList.toggle('technician-disabled-action', otroServicioEnCurso);
        botonAtender.innerHTML = esServicioIniciado(servicio.Estado)
            ? '<i data-lucide="play"></i> Continuar servicio'
            : '<i data-lucide="play"></i> Atender pedido';
        avisoServicioEnCurso.hidden = !otroServicioEnCurso;
        lucide.createIcons();
        prepararAccionesPedido(servicio, {
            chat: 'btn-chatear', llegar: 'btn-llegar', llamar: 'btn-llamar', mapa: 'mapa-pedido'
        });
        panelDetalle.classList.add('is-open');
    }

    function crearTarjeta(servicio) {
        const tarjeta = document.createElement('div');
        const iniciado = esServicioIniciado(servicio.Estado);
        tarjeta.className = `technician-card technician-order-card${iniciado ? ' is-in-progress' : ''}`;
        const nombreServicio = servicio.servicio ?? servicio.nombre_servicio ?? 'Servicio';
        const estado = servicio.Estado || 'No disponible';
        tarjeta.innerHTML = `
            ${iniciado ? '<div class="technician-active-order-label"><i data-lucide="zap"></i> Servicio en curso</div>' : ''}
            <div class="technician-layout-row">
                <b>${nombreServicio} #${servicio.id}</b>
                <span class="status ${obtenerClaseEstado(estado)}">${estado}</span>
            </div>
            <div class="technician-data-row">
                <i data-lucide="user-round"></i>
                <div>
                    <b>Cliente</b>
                    <span>${servicio.cliente || 'No disponible'}</span>
                </div>
            </div>
            <div class="technician-data-row">
                <i data-lucide="calendar-clock"></i>
                <div>
                    <b>Fecha y hora</b>
                    <span>${formatearFechaHoraServicio(servicio)}</span>
                </div>
            </div>
            <div class="technician-data-row">
                <i data-lucide="map-pin"></i>
                <div>
                    <b>Ubicación</b>
                    <span>${servicio.direccion || 'No disponible'}</span>
                </div>
            </div>
            <button class="btn btn-primary technician-full-width-button" data-accion="ver" style="margin-top: 8px">
                <i data-lucide="eye"></i> Ver
            </button>`;
        tarjeta.querySelector('[data-accion="ver"]')
            .addEventListener('click', () => abrirDetalle(servicio));
        return tarjeta;
    }

    async function cargarPedidosTecnico() {
        mensajeLista.innerHTML = 'Cargando pedidos...';
        listaPedidos.replaceChildren();

        try {
            const respuesta = await fetch(
                `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/servicios-pendientes`
            );
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudieron cargar los servicios.');
            }
            if (!Array.isArray(datos.payload)) {
                throw new Error('La respuesta del servidor no contiene una lista de servicios.');
            }

            if (datos.payload.length === 0) {
                servicioEnCursoId = null;
                mensajeLista.innerHTML = 'No tenés pedidos para mostrar.';
                return;
            }

            const servicioEnCurso = datos.payload.find((servicio) => esServicioIniciado(servicio.Estado));
            servicioEnCursoId = servicioEnCurso?.id ?? null;
            mensajeLista.innerHTML = '';
            datos.payload.forEach((servicio) => {
                listaPedidos.append(crearTarjeta(servicio));
            });
            lucide.createIcons();
        } catch (error) {
            console.error('Error al cargar los pedidos:', error);
            mensajeLista.innerHTML = 'No se pudieron cargar los pedidos.';
        }
    }

    document.getElementById('btn-cerrar-detalle').addEventListener('click', () => {
        panelDetalle.classList.remove('is-open');
    });

    document.getElementById('btn-atender').addEventListener('click', (evento) => {
        const botonAtender = evento.currentTarget;
        if (botonAtender.getAttribute('aria-disabled') === 'true') {
            evento.preventDefault();
            return;
        }
        evento.preventDefault();
        window.location.href = botonAtender.href;
    });

    document.getElementById('btn-cancelar-servicio').addEventListener('click', () => {
        if (!servicioSeleccionado) return;
        document.getElementById('error-cancelacion').hidden = true;
        confirmacionCancelacion.classList.add('is-open');
    });

    document.getElementById('btn-volver-cancelacion').addEventListener('click', () => {
        confirmacionCancelacion.classList.remove('is-open');
    });

    confirmacionCancelacion.addEventListener('click', (evento) => {
        if (evento.target === confirmacionCancelacion) {
            confirmacionCancelacion.classList.remove('is-open');
        }
    });

    botonConfirmarCancelacion.addEventListener('click', async () => {
        if (!servicioSeleccionado) return;

        botonConfirmarCancelacion.disabled = true;
        try {
            const respuesta = await fetch(
                `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/servicios/${encodeURIComponent(servicioSeleccionado.id)}/estado`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'cancelado' })
                }
            );
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudo cancelar el servicio.');
            }

            confirmacionCancelacion.classList.remove('is-open');
            panelDetalle.classList.remove('is-open');
            servicioSeleccionado = null;
            await cargarPedidosTecnico();
        } catch (error) {
            console.error('Error al cancelar el servicio:', error);
            const mensajeError = document.getElementById('error-cancelacion');
            mensajeError.textContent = error.message || 'No se pudo cancelar el servicio.';
            mensajeError.classList.add('technician-cancellation-error');
            mensajeError.hidden = false;
        } finally {
            botonConfirmarCancelacion.disabled = false;
        }
    });

    panelDetalle.addEventListener('click', (evento) => {
        if (evento.target === panelDetalle) {
            panelDetalle.classList.remove('is-open');
        }
    });

    const actualizarTextoDisponibilidad = () => {
        textoDisponibilidad.innerHTML = switchDisponible.checked ? 'Disponible' : 'No disponible';
    };

    switchDisponible.checked = tecnico.disponibilidad?.toLowerCase() === 'disponible';
    actualizarTextoDisponibilidad();
    switchDisponible.addEventListener('change', async () => {
        const disponibilidadAnterior = !switchDisponible.checked;
        const disponibilidad = switchDisponible.checked ? 'disponible' : 'no disponible';
        switchDisponible.disabled = true;

        try {
            const respuesta = await fetch(
                `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/disponibilidad`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ disponibilidad })
                }
            );
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudo actualizar la disponibilidad.');
            }

            tecnico.disponibilidad = datos.disponibilidad;
            localStorage.setItem('usuario', JSON.stringify(tecnico));
            actualizarTextoDisponibilidad();
        } catch (error) {
            console.error('Error al actualizar la disponibilidad:', error);
            switchDisponible.checked = disponibilidadAnterior;
            actualizarTextoDisponibilidad();
            window.alert(error.message || 'No se pudo actualizar la disponibilidad.');
        } finally {
            switchDisponible.disabled = false;
        }
    });

    cargarPedidosTecnico();
}
