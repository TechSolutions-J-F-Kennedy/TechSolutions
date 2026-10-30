const API_URL = location.protocol === 'file:' || location.port === '5500' ? 'http://localhost:3000' : ''; // '' = el mismo servidor que entregó la página (compu, celu o internet)

// Estados tal como se guardan en la BD y cómo se muestran en pantalla
const ESTADOS_SERVICIO = [
    { valor: 'pendiente', texto: 'Pendiente', clase: 'pending' },
    { valor: 'yendo', texto: 'Yendo', clase: 'progress' },
    { valor: 'en proceso', texto: 'En proceso', clase: 'progress' },
    { valor: 'finalizado', texto: 'Finalizado', clase: 'success' }
];

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
const servicioId = new URLSearchParams(location.search).get('id');

if (!tecnico) {
    window.location.href = 'index.html';
} else if (!servicioId) {
    window.location.href = 'inicio.html';
} else {
    const campo = (id) => document.getElementById(id);
    const hoja = campo('hoja-estado');
    const urlServicio = `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/servicios/${encodeURIComponent(servicioId)}`;

    function mostrarEstado(estado) {
        const valor = String(estado || '').trim().toLowerCase();
        const datos = ESTADOS_SERVICIO.find((e) => e.valor === valor);
        const insignia = document.createElement('span');
        insignia.className = `status ${datos?.clase || 'pending'}`;
        insignia.textContent = datos?.texto || estado || 'Sin estado';
        campo('estado').replaceChildren(insignia);
    }

    function mostrarFotoTrabajo(foto) {
        campo('imagen-trabajo').hidden = !foto;
        campo('sin-foto').hidden = Boolean(foto);
        campo('texto-foto').textContent = foto ? 'Cambiar foto' : 'Subir foto';
        if (foto) campo('imagen-trabajo').src = foto;
    }

    function textoHorario(servicio) {
        const fecha = servicio.fecha_servicio ? new Date(servicio.fecha_servicio).toLocaleDateString('es-AR') : '';
        const desde = String(servicio.hora_servicio || '').slice(0, 5);
        const hasta = String(servicio['fin-hora'] || '').slice(0, 5);
        const horas = desde && hasta ? `${desde} a ${hasta}` : desde;
        return [fecha, horas].filter(Boolean).join(' · ') || 'A coordinar';
    }

    function mostrarServicio(servicio) {
        campo('titulo').textContent = `Pedido #${servicio.id}`;
        campo('cliente').textContent = servicio.cliente || 'No disponible';
        campo('ubicacion').textContent = servicio.direccion || 'No disponible';
        campo('horario').textContent = textoHorario(servicio);
        campo('descripcion').textContent = servicio.descripcion || 'Sin detalle';
        mostrarEstado(servicio.Estado);
        mostrarFotoTrabajo(servicio.foto_final);
        prepararAccionesPedido(servicio, {
            chat: 'btn-chatear', llegar: 'btn-llegar', llamar: 'btn-llamar', mapa: 'mapa-pedido'
        });
        campo('datos').hidden = false;
        campo('trabajo').hidden = false;
        campo('mensaje').textContent = '';
    }

    async function cargarServicio() {
        campo('mensaje').textContent = 'Cargando pedido...';
        try {
            const respuesta = await fetch(urlServicio);
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudo cargar el pedido.');
            }
            mostrarServicio(datos.payload);
        } catch (error) {
            console.error('Error al cargar el pedido:', error);
            campo('mensaje').textContent = error.message || 'No se pudo cargar el pedido.';
        }
    }

    async function cambiarEstado(estado, boton) {
        boton.disabled = true;
        try {
            const respuesta = await fetch(`${urlServicio}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudo actualizar el estado.');
            }
            mostrarEstado(datos.estado);
            hoja.classList.remove('on');
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            window.alert(error.message || 'No se pudo actualizar el estado.');
        } finally {
            boton.disabled = false;
        }
    }

    ESTADOS_SERVICIO.forEach(({ valor, texto }) => {
        const boton = document.createElement('button');
        boton.className = 'btn btn-ghost';
        boton.textContent = texto;
        boton.addEventListener('click', () => cambiarEstado(valor, boton));
        campo('opciones-estado').append(boton);
    });

    campo('btn-estado').addEventListener('click', () => hoja.classList.add('on'));
    hoja.addEventListener('click', (evento) => {
        if (evento.target === hoja) hoja.classList.remove('on');
    });

    // Foto del trabajo terminado
    campo('foto-trabajo').addEventListener('change', async (evento) => {
        const archivo = evento.target.files[0];
        evento.target.value = '';
        if (!archivo) return;

        campo('texto-foto').textContent = 'Subiendo...';
        try {
            const foto = await achicarImagen(archivo, 1024, false);
            const respuesta = await fetch(`${urlServicio}/foto`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error || 'No se pudo guardar la foto.');
            mostrarFotoTrabajo(datos.foto);
        } catch (error) {
            console.error('Error al subir la foto del trabajo:', error);
            window.alert(error.message || 'No se pudo subir la foto.');
            mostrarFotoTrabajo(campo('imagen-trabajo').hidden ? null : campo('imagen-trabajo').src);
        }
    });

    cargarServicio();
}
