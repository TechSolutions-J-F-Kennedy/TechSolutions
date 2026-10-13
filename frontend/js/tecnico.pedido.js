const API_URL = 'http://localhost:3000';

// Estados tal como se guardan en la BD y cómo se muestran en pantalla
const ESTADOS_SERVICIO = [
    { valor: 'pendiente', texto: 'Pendiente' },
    { valor: 'yendo', texto: 'Yendo' },
    { valor: 'en proceso', texto: 'En proceso' },
    { valor: 'finalizado', texto: 'Finalizado' }
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
    const hoja = campo('sh');
    const opciones = campo('op');
    const urlServicio = `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/servicios/${encodeURIComponent(servicioId)}`;

    function textoEstado(estado) {
        const valor = String(estado || '').trim().toLowerCase();
        return ESTADOS_SERVICIO.find((e) => e.valor === valor)?.texto || estado || 'Sin estado';
    }

    function mostrarEstado(estado) {
        const texto = textoEstado(estado);
        const insignia = document.createElement('span');
        insignia.className = `badge ${texto}`;
        insignia.textContent = texto;
        campo('b').replaceChildren(insignia);
    }

    function mostrarServicio(servicio) {
        document.querySelector('h1').textContent = `Pedido #${servicio.id}`;
        campo('c').textContent = servicio.cliente || 'No disponible';
        campo('ub').textContent = servicio.direccion || 'No disponible';
        campo('ho').textContent = servicio.fecha_creacion || 'No disponible';
        campo('ma').textContent = servicio.materiales || 'No disponible';
        mostrarEstado(servicio.Estado);
    }

    async function cargarServicio() {
        try {
            const respuesta = await fetch(urlServicio);
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudo cargar el pedido.');
            }
            mostrarServicio(datos.payload);
        } catch (error) {
            console.error('Error al cargar el pedido:', error);
            campo('c').textContent = error.message || 'No se pudo cargar el pedido.';
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
        boton.className = 'btn o';
        boton.textContent = texto;
        boton.addEventListener('click', () => cambiarEstado(valor, boton));
        opciones.append(boton);
    });

    campo('ch').addEventListener('click', () => hoja.classList.add('on'));
    hoja.addEventListener('click', (evento) => {
        if (evento.target === hoja) hoja.classList.remove('on');
    });

    cargarServicio();
}
