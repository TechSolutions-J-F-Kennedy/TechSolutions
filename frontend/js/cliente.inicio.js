const API_URL = location.protocol === 'file:' || location.port === '5500' ? 'http://localhost:3000' : ''; // '' = el mismo servidor que entregó la página (compu, celu o internet)

// Etapas de un servicio, en orden (así se guardan en la columna Servicios.Estado)
const ETAPAS = [
    { valor: 'pendiente', texto: 'Asignado', clase: 'pending' },
    { valor: 'yendo', texto: 'En camino', clase: 'progress' },
    { valor: 'en proceso', texto: 'Trabajando', clase: 'progress' },
    { valor: 'finalizado', texto: 'Finalizado', clase: 'success' }
];

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
    const fecha = (valor) => (valor ? new Date(valor).toLocaleDateString('es-AR') : '');
    const estrellasTexto = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

    campo('saludo').textContent = `Hola ${cliente.nombre_real || cliente.nombre}`;

    function tarjetaSolicitud(s) {
        return `
            <div class="card pedido">
              <div class="row">
                <h3>Pedido enviado</h3>
                <span class="status pending">${esc(s.estado || 'Solicitado')}</span>
              </div>
              <p class="m" style="margin-top: 6px">${esc(s.descripcion)}</p>
              <p class="m" style="margin-top: 6px"><b>${esc(s.direccion)}</b> · ${fecha(s.fecha)}</p>
              <p class="m" style="margin-top: 8px">Estamos buscando un técnico para vos.</p>
            </div>`;
    }

    function tarjetaServicio(s) {
        const indice = Math.max(0, ETAPAS.findIndex((e) => e.valor === String(s.Estado || '').trim().toLowerCase()));
        const etapa = ETAPAS[indice];
        const finalizado = etapa.valor === 'finalizado';
        const nombreTecnico = s.tecnico || s.tecnico_usuario || 'Técnico';
        const iniciales = nombreTecnico.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
        const reputacion = s.tecnico_reputacion ? ` · ★ ${Number(s.tecnico_reputacion).toFixed(1)}` : '';

        let calificacion = '';
        if (finalizado && s.mi_estrella) {
            calificacion = `<p class="mi-calificacion">Tu calificación: ${estrellasTexto(s.mi_estrella)}</p>`;
        }

        return `
            <div class="card pedido">
              <div class="row">
                <h3>Pedido #${s.id}</h3>
                <span class="status ${etapa.clase}">${etapa.texto}</span>
              </div>
              <p class="m" style="margin-top: 6px">${esc(s.descripcion || 'Servicio técnico')}</p>

              <div class="pbar">${ETAPAS.map((_, k) => `<span class="${k <= indice ? 'done' : ''}"></span>`).join('')}</div>
              <div class="etapas">${ETAPAS.map((e, k) => `<span class="${k <= indice ? 'hecha' : ''}">${e.texto}</span>`).join('')}</div>

              <div class="tecnico">
                <div class="av">${esc(iniciales)}<img src="${API_URL}/api/usuarios/${encodeURIComponent(s.tecnico_id)}/foto/imagen" alt="" onerror="this.remove()"></div>
                <div>
                  <b>${esc(nombreTecnico)}</b>
                  <span class="m">${esc(s.tecnico_categoria || 'Técnico')}${reputacion}</span>
                </div>
              </div>

              ${s.fecha_servicio ? `<p class="m" style="margin-top: 10px">Fecha: <b>${fecha(s.fecha_servicio)}${s.hora_servicio ? ' · ' + esc(String(s.hora_servicio).slice(0, 5)) : ''}</b></p>` : ''}
              ${s.foto_final ? `<img class="foto-trabajo" src="${s.foto_final}" alt="Foto del trabajo terminado">` : ''}
              ${calificacion}

              <div class="acciones-cliente">
                <a class="btn btn-ghost" href="chat.html?con=${encodeURIComponent(s.tecnico_id)}">
                  <i data-lucide="message-circle"></i> Chatear
                </a>
                ${finalizado && !s.mi_estrella ? `
                <button class="btn btn-primary" data-calificar="${s.id}" data-tecnico="${esc(nombreTecnico)}">
                  <i data-lucide="star"></i> Calificar
                </button>` : ''}
              </div>
            </div>`;
    }

    async function cargarPedidos() {
        try {
            const respuesta = await fetch(`${urlCliente}/pedidos`);
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar tus pedidos.');

            const { solicitudes, servicios } = datos.payload;
            const html = [...solicitudes.map(tarjetaSolicitud), ...servicios.map(tarjetaServicio)].join('');
            campo('lista').innerHTML = html;
            campo('mensaje').textContent = html ? '' : 'Todavía no hiciste ningún pedido.';
            lucide.createIcons();
        } catch (error) {
            console.error('Error al cargar los pedidos:', error);
            campo('mensaje').textContent = error.message || 'No se pudieron cargar tus pedidos.';
        }
    }

    /* ===== Calificar al técnico ===== */
    const hoja = campo('hoja-resena');
    let servicioACalificar = null;
    let estrellasElegidas = 0;

    campo('estrellas').innerHTML = [1, 2, 3, 4, 5]
        .map((n) => `<button type="button" data-n="${n}" aria-label="${n} estrellas"><i data-lucide="star"></i></button>`)
        .join('');

    function pintarEstrellas() {
        campo('estrellas').querySelectorAll('button').forEach((b) => {
            b.classList.toggle('on', Number(b.dataset.n) <= estrellasElegidas);
        });
        campo('resena-enviar').disabled = estrellasElegidas === 0;
    }

    campo('estrellas').addEventListener('click', (evento) => {
        const boton = evento.target.closest('button');
        if (!boton) return;
        estrellasElegidas = Number(boton.dataset.n);
        pintarEstrellas();
    });

    campo('lista').addEventListener('click', (evento) => {
        const boton = evento.target.closest('[data-calificar]');
        if (!boton) return;
        servicioACalificar = boton.dataset.calificar;
        estrellasElegidas = 0;
        campo('resena-tecnico').textContent = boton.dataset.tecnico;
        campo('resena-comentario').value = '';
        pintarEstrellas();
        hoja.classList.add('on');
    });

    const cerrarHoja = () => hoja.classList.remove('on');
    campo('resena-cancelar').addEventListener('click', cerrarHoja);
    hoja.addEventListener('click', (evento) => {
        if (evento.target === hoja) cerrarHoja();
    });

    campo('resena-enviar').addEventListener('click', async () => {
        const boton = campo('resena-enviar');
        boton.disabled = true;
        try {
            const respuesta = await fetch(`${urlCliente}/resenas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    servicio_id: servicioACalificar,
                    estrella: estrellasElegidas,
                    comentario: campo('resena-comentario').value.trim()
                })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error || 'No se pudo guardar tu calificación.');
            cerrarHoja();
            cargarPedidos();
        } catch (error) {
            console.error('Error al calificar:', error);
            window.alert(error.message || 'No se pudo guardar tu calificación.');
            boton.disabled = false;
        }
    });

    // Tiempo real: cuando un técnico acepta el pedido, se actualiza la lista sola
    if (!EMB) {
        const avisos = new EventSource(`${API_URL}/api/chat/${encodeURIComponent(cliente.id)}/tiempo-real`);
        avisos.addEventListener('pedido-asignado', cargarPedidos);
    }

    cargarPedidos();
    lucide.createIcons();
}
