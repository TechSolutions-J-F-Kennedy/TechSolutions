const API_URL = location.protocol === 'file:' || location.port === '5500' ? 'http://localhost:3000' : ''; // '' = el mismo servidor que entregó la página (compu, celu o internet)

function obtenerCliente() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        return usuario?.rol === 'usuario' && usuario.id ? usuario : null;
    } catch (error) {
        console.error('No se pudieron leer los datos del cliente:', error);
        return null;
    }
}

const cliente = obtenerCliente();

if (!cliente) {
    window.location.href = 'index.html';
} else {
    const campo = (id) => document.getElementById(id);
    const urlCliente = `${API_URL}/api/clientes/${encodeURIComponent(cliente.id)}`;
    const esc = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // Opciones de dirección: las guardadas (con ubicación) + "Otra dirección"
    function mostrarDirecciones(direcciones) {
        const guardadas = direcciones.filter((d) => d.latitud !== null && d.longitud !== null);
        const opciones = guardadas.map((d, k) => `
            <label class="opcion-dir">
              <input type="radio" name="dir" value="${d.id}" ${k === 0 ? 'checked' : ''}>
              <span><b>${esc(d.alias || 'Dirección')}</b>${esc(d.direccion_completa)}</span>
            </label>`);
        opciones.push(`
            <label class="opcion-dir">
              <input type="radio" name="dir" value="otra" ${guardadas.length ? '' : 'checked'}>
              <span><b>Otra dirección</b>Escribila abajo</span>
            </label>`);
        campo('direcciones').innerHTML = opciones.join('');
        actualizarCampoDireccion();
    }

    const elegida = () => document.querySelector('input[name="dir"]:checked')?.value;

    function actualizarCampoDireccion() {
        const otra = elegida() === 'otra';
        campo('campo-direccion').hidden = !otra;
        campo('direccion').required = otra;
    }

    campo('direcciones').addEventListener('change', actualizarCampoDireccion);

    async function cargarDirecciones() {
        try {
            const respuesta = await fetch(`${urlCliente}/direcciones`);
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error);
            mostrarDirecciones(datos.payload);
        } catch (error) {
            console.error('No se pudieron cargar tus direcciones:', error);
            mostrarDirecciones([]);
        }
    }

    campo('form-pedido').addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const boton = campo('enviar');
        boton.disabled = true;
        boton.lastChild.textContent = ' Buscando técnicos cerca...';

        const cuerpo = { descripcion: campo('descripcion').value.trim() };
        if (elegida() === 'otra') cuerpo.direccion = campo('direccion').value.trim();
        else cuerpo.direccion_id = Number(elegida());

        try {
            const respuesta = await fetch(`${urlCliente}/solicitudes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuerpo)
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error || 'No se pudo enviar el pedido.');

            campo('texto-listo').textContent = datos.tecnicos_avisados
                ? `Se lo mandamos a ${datos.tecnicos_avisados} técnico${datos.tecnicos_avisados === 1 ? '' : 's'} cerca tuyo. Cuando uno lo acepte vas a verlo en el Inicio.`
                : 'Lo recibimos, pero por ahora no hay técnicos cerca de esa dirección. Te avisamos cuando alguien lo acepte.';
            campo('form-pedido').hidden = true;
            campo('listo').hidden = false;
        } catch (error) {
            console.error('Error al enviar el pedido:', error);
            window.alert(error.message || 'No se pudo enviar el pedido.');
        } finally {
            boton.disabled = false;
            boton.lastChild.textContent = ' Enviar pedido';
        }
    });

    cargarDirecciones();
}
