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
        prepararAccionesPedido(servicio, {
            chat: 'btn-chatear', llegar: 'btn-llegar', llamar: 'btn-llamar', mapa: 'mapa-pedido'
        });
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

    /* ===== Pedidos nuevos de clientes cercanos ===== */
    const listaCerca = document.getElementById('lista-cerca');
    const mensajeCerca = document.getElementById('mensaje-cerca');
    const esc = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function hace(fecha) {
        const minutos = Math.max(0, Math.round((Date.now() - fecha) / 60000));
        if (minutos < 1) return 'recién';
        if (minutos < 60) return `hace ${minutos} min`;
        const horas = Math.round(minutos / 60);
        return horas < 24 ? `hace ${horas} h` : new Date(fecha).toLocaleDateString('es-AR');
    }

    async function cargarPedidosCerca() {
        try {
            const respuesta = await fetch(`${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/solicitudes-cercanas`);
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar los pedidos cercanos.');

            mensajeCerca.textContent = datos.payload.length ? '' : 'No hay pedidos nuevos cerca tuyo.';
            listaCerca.innerHTML = datos.payload.map((s) => `
                <div class="card pedido">
                  <div class="row">
                    <b>${esc(s.cliente || s.cliente_usuario || 'Cliente')}</b>
                    <span class="status progress">a ${Number(s.distancia_km).toLocaleString('es-AR')} km</span>
                  </div>
                  <p class="m" style="margin: 8px 0">${esc(s.descripcion)}</p>
                  <div class="kv">
                    <i data-lucide="map-pin"></i>
                    <div>
                      <b>Ubicación · ${hace(s.fecha)}</b>
                      <span>${esc(s.direccion)}</span>
                    </div>
                  </div>
                  <button class="btn btn-primary full" data-aceptar="${s.id}" style="margin-top: 8px">
                    <i data-lucide="check"></i> Aceptar pedido
                  </button>
                </div>`).join('');
            lucide.createIcons();
        } catch (error) {
            console.error('Error al cargar los pedidos cercanos:', error);
            mensajeCerca.textContent = 'No se pudieron cargar los pedidos cercanos.';
        }
    }

    listaCerca.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-aceptar]');
        if (!boton) return;
        if (!window.confirm('¿Aceptás este pedido? Vas a quedar asignado como su técnico.')) return;

        boton.disabled = true;
        try {
            const respuesta = await fetch(
                `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/solicitudes/${encodeURIComponent(boton.dataset.aceptar)}/aceptar`,
                { method: 'POST' }
            );
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error || 'No se pudo aceptar el pedido.');
            window.location.href = `pedido_actual.html?id=${encodeURIComponent(datos.servicio_id)}`;
        } catch (error) {
            console.error('Error al aceptar el pedido:', error);
            window.alert(error.message || 'No se pudo aceptar el pedido.');
            cargarPedidosCerca();
        }
    });

    // Tiempo real: cuando entra un pedido cerca, o cuando otro técnico lo toma, se actualiza la lista
    if (!EMB) {
        const avisos = new EventSource(`${API_URL}/api/chat/${encodeURIComponent(tecnico.id)}/tiempo-real`);
        avisos.addEventListener('solicitud-nueva', cargarPedidosCerca);
        avisos.addEventListener('solicitud-tomada', cargarPedidosCerca);
    }

    cargarPedidosCerca();
    cargarServiciosPendientes();
}
