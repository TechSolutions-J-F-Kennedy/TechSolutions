const API_URL = location.protocol === 'file:' ? 'http://localhost:3000'
    : location.port === '5500' ? `${location.protocol}//${location.hostname}:3000`
        : '';

function obtenerTecnicoHerramientas() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        return usuario?.rol === 'tecnico' && usuario.id ? usuario : null;
    } catch (error) {
        console.error('No se pudieron leer los datos del técnico:', error);
        return null;
    }
}

const tecnicoHerramientas = obtenerTecnicoHerramientas();

if (!tecnicoHerramientas) {
    window.location.href = 'index.html';
} else {
    const selectorProducto = document.getElementById('producto-insumo');
    const entradaCantidad = document.getElementById('cantidad-insumo');
    const textoStock = document.getElementById('stock-insumo');
    const formularioSolicitud = document.getElementById('form-solicitud-insumo');
    const botonSolicitud = document.getElementById('solicitar-insumo');
    const mensaje = document.getElementById('mensaje-insumo');
    const panelQr = document.getElementById('codigo-insumo-panel');
    const qrContenedor = document.getElementById('codigo-insumo-qr');
    const detalleQr = document.getElementById('detalle-codigo-insumo');
    const listaSolicitudes = document.getElementById('lista-solicitudes-insumo');
    const estadoSolicitudes = document.getElementById('estado-solicitudes-insumo');
    const estadosConocidos = new Map();
    let productos = [];
    let actualizandoSolicitudes = false;
    let solicitudQrId = null;

    function mostrarMensaje(texto, correcto = false) {
        mensaje.textContent = texto;
        mensaje.hidden = !texto;
        mensaje.classList.toggle('is-success', correcto);
    }

    async function leerRespuesta(respuesta) {
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || 'No se pudo completar la operación.');
        return datos;
    }

    function productoSeleccionado() {
        return productos.find((producto) => String(producto.id) === selectorProducto.value);
    }

    function actualizarDisponibilidad() {
        const producto = productoSeleccionado();
        textoStock.textContent = producto
            ? `Disponibles: ${producto.stock_actual}`
            : '';
        entradaCantidad.max = producto ? String(producto.stock_actual) : '99';
        if (producto && Number(entradaCantidad.value) > Number(producto.stock_actual)) {
            entradaCantidad.value = String(producto.stock_actual);
        }
    }

    async function cargarProductos() {
        const respuesta = await fetch(`${API_URL}/api/tecnicos/insumos/productos`);
        const datos = await leerRespuesta(respuesta);
        productos = datos.payload || [];
        selectorProducto.replaceChildren();

        const inicial = document.createElement('option');
        inicial.value = '';
        inicial.textContent = productos.length ? 'Seleccioná un producto' : 'No hay productos disponibles';
        selectorProducto.append(inicial);

        productos.forEach((producto) => {
            const opcion = document.createElement('option');
            opcion.value = producto.id;
            opcion.textContent = `${producto.nombre} · ${producto.stock_actual} disponibles`;
            selectorProducto.append(opcion);
        });
        selectorProducto.disabled = productos.length === 0;
        botonSolicitud.disabled = productos.length === 0;
        actualizarDisponibilidad();
    }

    function etiquetaEstado(estado) {
        const etiquetas = {
            pendiente: 'Pendiente de escaneo',
            entregado: 'Entrega confirmada',
            vencida: 'Código vencido',
            sin_stock: 'Sin stock disponible'
        };
        return etiquetas[estado] || 'Estado desconocido';
    }

    function mostrarSolicitudes(solicitudes) {
        listaSolicitudes.replaceChildren();
        if (solicitudes.length === 0) {
            estadoSolicitudes.textContent = 'Todavía no tenés solicitudes.';
            return;
        }
        estadoSolicitudes.textContent = '';

        solicitudes.forEach((solicitud) => {
            const fila = document.createElement('article');
            fila.className = 'technician-tools-request';
            const encabezado = document.createElement('div');
            encabezado.className = 'technician-tools-request-heading';
            const producto = document.createElement('span');
            producto.textContent = `${solicitud.producto} × ${solicitud.cantidad}`;
            const estado = document.createElement('span');
            estado.className = 'technician-tools-request-state';
            estado.textContent = etiquetaEstado(solicitud.estado);
            encabezado.append(producto, estado);
            fila.append(encabezado);

            if (solicitud.estado === 'pendiente' && new Date(solicitud.vence_en) > new Date()) {
                const vence = document.createElement('p');
                vence.className = 'technician-help-text';
                vence.textContent = 'Esperando que el encargado escanee el QR.';
                fila.append(vence);
            }
            listaSolicitudes.append(fila);

            if (solicitud.estado === 'entregado' && estadosConocidos.get(solicitud.id) === 'pendiente') {
                mostrarMensaje(`Entrega confirmada: ${solicitud.producto} × ${solicitud.cantidad}.`, true);
                if (String(solicitud.id) === String(solicitudQrId)) {
                    panelQr.hidden = true;
                    solicitudQrId = null;
                }
            } else if (solicitud.estado === 'vencida' && estadosConocidos.get(solicitud.id) === 'pendiente') {
                mostrarMensaje('El código de entrega venció. Generá una solicitud nueva.');
                if (String(solicitud.id) === String(solicitudQrId)) {
                    panelQr.hidden = true;
                    solicitudQrId = null;
                }
            }
            estadosConocidos.set(solicitud.id, solicitud.estado);
        });
    }

    async function cargarSolicitudes() {
        if (actualizandoSolicitudes) return;
        actualizandoSolicitudes = true;
        try {
            const respuesta = await fetch(
                `${API_URL}/api/tecnicos/${encodeURIComponent(tecnicoHerramientas.id)}/insumos/solicitudes`
            );
            const datos = await leerRespuesta(respuesta);
            mostrarSolicitudes(datos.payload || []);
        } catch (error) {
            console.error('Error al consultar solicitudes de insumos:', error);
            estadoSolicitudes.textContent = error.message || 'No se pudieron consultar las solicitudes.';
        } finally {
            actualizandoSolicitudes = false;
        }
    }

    selectorProducto.addEventListener('change', actualizarDisponibilidad);
    entradaCantidad.addEventListener('input', () => {
        const producto = productoSeleccionado();
        if (producto && Number(entradaCantidad.value) > Number(producto.stock_actual)) {
            entradaCantidad.value = String(producto.stock_actual);
        }
    });

    formularioSolicitud.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const producto = productoSeleccionado();
        const cantidad = Number(entradaCantidad.value);
        if (!producto || !Number.isInteger(cantidad) || cantidad < 1) {
            mostrarMensaje('Seleccioná un producto y una cantidad válida.');
            return;
        }
        if (!window.QRCode) {
            mostrarMensaje('No se pudo cargar el generador de códigos QR.');
            return;
        }
        if (location.protocol === 'file:') {
            mostrarMensaje('Abrí la aplicación desde el servidor para generar un QR que el encargado pueda escanear.');
            return;
        }

        botonSolicitud.disabled = true;
        mostrarMensaje('');
        try {
            const respuesta = await fetch(
                `${API_URL}/api/tecnicos/${encodeURIComponent(tecnicoHerramientas.id)}/insumos/solicitudes`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productoId: producto.id, cantidad })
                }
            );
            const datos = await leerRespuesta(respuesta);

            qrContenedor.replaceChildren();
            const paginaEntrega = new URL('entregar-insumo.html', window.location.href);
            paginaEntrega.hash = new URLSearchParams({ token: datos.token }).toString();
            new QRCode(qrContenedor, {
                text: paginaEntrega.href,
                width: 220,
                height: 220,
                correctLevel: QRCode.CorrectLevel.M
            });
            detalleQr.textContent = `${datos.producto} × ${datos.cantidad} · Solicitud #${datos.solicitudId}`;
            solicitudQrId = datos.solicitudId;
            panelQr.hidden = false;
            estadosConocidos.set(datos.solicitudId, 'pendiente');
            await cargarSolicitudes();
        } catch (error) {
            console.error('Error al generar solicitud de insumo:', error);
            mostrarMensaje(error.message || 'No se pudo generar el código de entrega.');
        } finally {
            botonSolicitud.disabled = false;
        }
    });

    cargarProductos().catch((error) => {
        console.error('Error al cargar productos de inventario:', error);
        selectorProducto.replaceChildren(new Option('No se pudieron cargar los productos', ''));
        selectorProducto.disabled = true;
        botonSolicitud.disabled = true;
        mostrarMensaje(error.message || 'No se pudieron cargar los productos.');
    });
    cargarSolicitudes();
    window.setInterval(cargarSolicitudes, 5000);
    if (window.lucide) window.lucide.createIcons();
}
