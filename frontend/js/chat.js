const API_URL = location.port === '3000' ? '' : 'http://localhost:3000'; // '' = mismo servidor (sirve desde el celular)

function obtenerUsuarioChat() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        return usuario?.id ? usuario : null;
    } catch (error) {
        console.error('No se pudieron leer los datos del usuario:', error);
        return null;
    }
}

const yo = obtenerUsuarioChat();

if (!yo) {
    window.location.href = 'index.html';
} else {
    const D = 864e5;
    let conversaciones = [];
    let mensajes = [];
    let abierto = null;

    const p2 = (n) => String(n).padStart(2, '0');
    const hm = (t) => {
        const d = new Date(t);
        return p2(d.getHours()) + ':' + p2(d.getMinutes());
    };
    const day = (t) => {
        const a = new Date(t);
        const b = new Date();
        a.setHours(0, 0, 0, 0);
        b.setHours(0, 0, 0, 0);
        return Math.round((b - a) / D);
    };
    const dm = (t) => {
        const d = new Date(t);
        return p2(d.getDate()) + '/' + p2(d.getMonth() + 1);
    };
    const lab = (t) =>
        day(t) == 0 ? 'Hoy' : day(t) == 1 ? 'Ayer' : dm(t) + '/' + new Date(t).getFullYear();
    const when = (t) => (t ? (day(t) == 0 ? hm(t) : day(t) == 1 ? 'Ayer' : dm(t)) : '');
    const esc = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const nombreDe = (c) => [c.nombre_real, c.apellido].filter(Boolean).join(' ') || c.nombre || 'Usuario';
    const inicialesDe = (c) =>
        nombreDe(c).split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
    const etiquetaRol = (c) => (c.rol === 'usuario' ? ' · Cliente' : c.rol === 'tecnico' ? ' · Técnico' : '');
    // Mensajes propios: los que mandé con mi rol (tecnico o usuario)
    const esMio = (remitente) => remitente === yo.rol;
    // Id de la otra persona en un mensaje de la tabla Mensajes
    const otroDe = (m) => (yo.rol === 'tecnico' ? m.usuario_id : m.tecnico_id);

    async function pedir(url, opciones) {
        const respuesta = await fetch(API_URL + url, opciones);
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || 'Error de servidor');
        return datos;
    }

    function list() {
        const q = $('#q').value.toLowerCase();
        const a = conversaciones.filter((c) => nombreDe(c).toLowerCase().includes(q));

        $('#ls').innerHTML = a.length
            ? a
                  .map((c) => {
                      const mio = esMio(c.ultimo_remitente);
                      return `
                        <div class="row2" data-id="${c.id}">
                          <div class="av">${esc(inicialesDe(c))}</div>
                          <div class="mid">
                            <div class="r">
                              <b>${esc(nombreDe(c) + etiquetaRol(c))}</b>
                              <small class="${c.no_leidos ? 'u' : ''}">${when(c.ultima_fecha)}</small>
                            </div>
                            <div class="r">
                              <span class="pv">${mio ? '<i data-lucide="check"></i>' : ''}${esc(c.ultimo_mensaje || 'Empezá la conversación')}</span>
                              ${c.no_leidos ? `<em>${c.no_leidos}</em>` : ''}
                            </div>
                          </div>
                        </div>
                      `;
                  })
                  .join('')
            : '<p class="m" style="text-align:center;margin-top:30px">No hay chats</p>';

        lucide.createIcons();
    }

    function conv() {
        let h = '';
        let pd = '';

        mensajes.forEach((m) => {
            const d = lab(m.fecha);
            if (d != pd) {
                h += `<div class="day"><span>${d}</span></div>`;
                pd = d;
            }
            const mio = esMio(m.remitente);
            h += `<div class="b ${mio ? 'me' : 'th'}">${esc(m.mensaje)}<small>${hm(m.fecha)}${mio ? '<i data-lucide="check"></i>' : ''}</small></div>`;
        });

        $('#cm').innerHTML = h;
        lucide.createIcons();
        $('#cm').scrollTop = $('#cm').scrollHeight;
    }

    async function cargarConversaciones() {
        try {
            const datos = await pedir(`/api/chat/${encodeURIComponent(yo.id)}/conversaciones`);
            conversaciones = datos.payload;
            list();
        } catch (error) {
            console.error('Error al cargar los chats:', error);
            $('#ls').innerHTML = '<p class="m" style="text-align:center;margin-top:30px">No se pudieron cargar los chats</p>';
        }
    }

    async function openC(id) {
        const c = conversaciones.find((x) => x.id == id);
        if (!c) return;
        abierto = id;
        c.no_leidos = 0;

        $('#cav').textContent = inicialesDe(c);
        $('#cn').textContent = nombreDe(c) + etiquetaRol(c);
        $('#cs').textContent = 'cargando…';
        mensajes = [];
        conv();
        $('#cv').classList.add('on');

        try {
            const datos = await pedir(`/api/chat/${encodeURIComponent(yo.id)}/mensajes/${encodeURIComponent(id)}`);
            if (abierto != id) return;
            mensajes = datos.payload;
            $('#cs').textContent = c.rol === 'usuario' ? 'cliente' : c.rol || '';
            conv();
        } catch (error) {
            console.error('Error al cargar los mensajes:', error);
            $('#cs').textContent = 'no se pudieron cargar los mensajes';
        }
    }

    async function send() {
        const v = $('#t').value.trim();
        if (!v || !abierto) return;

        $('#t').value = '';
        try {
            await pedir('/api/chat/mensajes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emisor_id: yo.id, receptor_id: abierto, mensaje: v })
            });
            // El mensaje se dibuja cuando llega por el canal en tiempo real
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            $('#t').value = v;
            window.alert(error.message || 'No se pudo enviar el mensaje.');
        }
    }

    function recibirMensaje(m) {
        const otroId = otroDe(m);
        const c = conversaciones.find((x) => x.id == otroId);

        if (!c) {
            // Alguien nuevo nos escribió: recargar la lista para traer sus datos
            cargarConversaciones();
            return;
        }

        c.ultimo_mensaje = m.mensaje;
        c.ultimo_remitente = m.remitente;
        c.ultima_fecha = m.fecha;
        conversaciones = [c, ...conversaciones.filter((x) => x !== c)];

        if (abierto == otroId) {
            if (!mensajes.some((x) => x.id == m.id)) mensajes.push(m);
            conv();
        } else if (!esMio(m.remitente)) {
            c.no_leidos = (Number(c.no_leidos) || 0) + 1;
        }
        list();
    }

    function conectarTiempoReal() {
        const fuente = new EventSource(`${API_URL}/api/chat/${encodeURIComponent(yo.id)}/tiempo-real`);

        fuente.addEventListener('mensaje', (e) => recibirMensaje(JSON.parse(e.data)));

        // Si se cae la conexión, EventSource reintenta solo; al volver, refrescamos
        fuente.addEventListener('conectado', () => {
            cargarConversaciones();
            if (abierto) openC(abierto);
        });
    }

    $('#ls').onclick = (e) => {
        const r = e.target.closest('.row2');
        if (r) openC(+r.dataset.id);
    };

    $('#bk').onclick = () => {
        abierto = null;
        $('#cv').classList.remove('on');
        list();
    };

    $('#q').oninput = list;
    $('#sd').onclick = send;
    $('#t').onkeydown = (e) => {
        if (e.key == 'Enter') send();
    };

    // La vista previa al deslizar (iframe) no necesita conexión en tiempo real
    if (EMB) cargarConversaciones();
    else conectarTiempoReal();
}
