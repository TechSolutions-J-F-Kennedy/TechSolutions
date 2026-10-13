const API_URL = 'http://localhost:3000';

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
    const switchDisponible = document.getElementById('switch-disponible');
    const textoDisponibilidad = document.getElementById('switch-texto');

    document.getElementById('saludo').innerHTML = `Hola ${tecnico.nombre}`;

    function obtenerClaseEstado(estado) {
        const estadoNormalizado = String(estado || '').trim().toLowerCase();
        if (estadoNormalizado.includes('final')) return 'success';
        if (estadoNormalizado.includes('proceso') || estadoNormalizado.includes('yendo')) return 'progress';
        return 'pending';
    }

    function abrirDetalle(servicio) {
        panelDetalle.querySelector('[data-campo="numero"]').innerHTML = `Pedido #${servicio.id}`;
        const estado = servicio.Estado || 'No disponible';
        panelDetalle.querySelector('[data-campo="estado"]').innerHTML =
            `<span class="status ${obtenerClaseEstado(estado)}">${estado}</span>`;
        panelDetalle.querySelector('[data-campo="servicio"]').innerHTML = servicio.servicio || 'No disponible';
        panelDetalle.querySelector('[data-campo="cliente"]').innerHTML = servicio.cliente || 'No disponible';
        panelDetalle.querySelector('[data-campo="telefono"]').innerHTML = servicio.telefono || 'No disponible';
        panelDetalle.querySelector('[data-campo="ubicacion"]').innerHTML = servicio.direccion || 'No disponible';
        panelDetalle.querySelector('[data-campo="horario"]').innerHTML = servicio.fecha_creacion || 'No disponible';
        panelDetalle.querySelector('[data-campo="materiales"]').innerHTML = servicio.materiales || 'No disponible';
        panelDetalle.querySelector('[data-campo="descripcion"]').innerHTML = servicio.descripcion || 'No disponible';
        document.getElementById('btn-atender')
            .setAttribute('href', `pedido_actual.html?id=${encodeURIComponent(servicio.id)}`);
        panelDetalle.classList.add('on');
    }

    function crearTarjeta(servicio) {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'card pedido';
        const nombreServicio = servicio.servicio ?? servicio.nombre_servicio ?? 'Servicio';
        const estado = servicio.Estado || 'No disponible';
        tarjeta.innerHTML = `
            <div class="row">
                <b>${nombreServicio} #${servicio.id}</b>
                <span class="status ${obtenerClaseEstado(estado)}">${estado}</span>
            </div>
            <div class="kv">
                <i data-lucide="user-round"></i>
                <div>
                    <b>Cliente</b>
                    <span>${servicio.cliente || 'No disponible'}</span>
                </div>
            </div>
            <div class="kv">
                <i data-lucide="map-pin"></i>
                <div>
                    <b>Ubicación</b>
                    <span>${servicio.direccion || 'No disponible'}</span>
                </div>
            </div>
            <button class="btn btn-primary full" data-accion="ver" style="margin-top: 8px">
                <i data-lucide="eye"></i> Ver
            </button>`;
        tarjeta.querySelector('[data-accion="ver"]')
            .addEventListener('click', () => abrirDetalle(servicio));
        return tarjeta;
    }

    async function cargarServiciosPendientes() {
        mensajeLista.innerHTML = 'Cargando servicios pendientes...';
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
                mensajeLista.innerHTML = 'No tenés servicios pendientes.';
                return;
            }

            mensajeLista.innerHTML = '';
            datos.payload.forEach((servicio) => {
                listaPedidos.append(crearTarjeta(servicio));
            });
            lucide.createIcons();
        } catch (error) {
            console.error('Error al cargar los servicios pendientes:', error);
            mensajeLista.innerHTML = 'No se pudieron cargar los servicios pendientes.';
        }
    }

    document.getElementById('btn-cerrar-detalle').addEventListener('click', () => {
        panelDetalle.classList.remove('on');
    });

    panelDetalle.addEventListener('click', (evento) => {
        if (evento.target === panelDetalle) {
            panelDetalle.classList.remove('on');
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

    cargarServiciosPendientes();
}
