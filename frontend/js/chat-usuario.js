const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501')
  ? 'http://localhost:3000'
  : '';

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  const usuarioGuardado = localStorage.getItem('usuario');
  if (!usuarioGuardado) {
    Swal.fire({
      icon: 'warning',
      title: 'Sesión requerida',
      text: 'Debes iniciar sesión para chatear.'
    }).then(() => {
      window.location.href = 'index.html';
    });
    return;
  }

  const usuario = JSON.parse(usuarioGuardado);
  const tecnicoId = localStorage.getItem('chatActivo_tecnicoId') || '1';
  const nombreTecnico = localStorage.getItem('chatActivo_nombreTecnico') || 'Técnico';

  // Mostrar nombre del técnico
  const nameEl = document.getElementById('chat-tech-name');
  if (nameEl) nameEl.textContent = nombreTecnico;

  // Cargar foto o iniciales del técnico en el encabezado del chat
  await cargarFotoEncabezadoTecnico(tecnicoId, nombreTecnico);

  const btnBackChat = document.getElementById('btn-back-chat');
  if (btnBackChat) {
    btnBackChat.addEventListener('click', () => window.history.back());
  }

  const inputMensaje = document.getElementById('mensaje-input');
  const btnEnviar = document.getElementById('btn-enviar-mensaje');
  const contenedorMensajes = document.getElementById('chat-messages-container');

  // 1. Cargar historial inicial de mensajes desde la BD
  let ultimaCantidad = -1;

  async function cargarHistorial() {
    try {
      const res = await fetch(`${BASE_URL}/api/mensajes/${usuario.id}/${tecnicoId}`);
      const mensajes = await res.json();

      if (res.ok) {
        if (mensajes.length === ultimaCantidad) return; // Nada nuevo
        ultimaCantidad = mensajes.length;

        contenedorMensajes.innerHTML = '';
        mensajes.forEach(msg => {
          agregarBurbujaMensaje(msg.remitente === 'usuario', msg.mensaje, msg.hora);
        });
        window.scrollTo(0, document.documentElement.scrollHeight);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  }

  // 2. Enviar mensaje al backend vía POST
  async function enviarMensaje() {
    const texto = inputMensaje.value.trim();
    if (!texto) return;

    const payload = {
      usuario_id: usuario.id,
      tecnico_id: tecnicoId,
      remitente: 'usuario',
      mensaje: texto
    };

    try {
      const res = await fetch(`${BASE_URL}/api/mensajes/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        inputMensaje.value = '';
        cargarHistorial(); // Recarga el chat para mostrar el mensaje recién guardado
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar',
          text: 'No se pudo enviar el mensaje.'
        });
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'Ocurrió un fallo al conectar con el servidor.'
      });
    }
  }

  function agregarBurbujaMensaje(esMio, texto, hora) {
    const div = document.createElement('div');
    div.className = `message-bubble ${esMio ? 'sent' : 'received'}`;
    div.innerHTML = `
      <div>${escapeHTML(texto)}</div>
      <span class="message-time">${hora || 'Recién'}</span>
    `;
    contenedorMensajes.appendChild(div);
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
  }

  if (btnEnviar) btnEnviar.addEventListener('click', enviarMensaje);
  if (inputMensaje) {
    inputMensaje.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') enviarMensaje();
    });
  }

  // Cargar al iniciar
  cargarHistorial();

  // Polling cada 4 segundos
  setInterval(cargarHistorial, 4000);
});

// Función para consultar y renderizar la foto/iniciales del técnico en la cabecera
async function cargarFotoEncabezadoTecnico(tecnicoId, nombreTecnico) {
  const techAvatarEl = document.getElementById('chat-tech-avatar');
  if (!techAvatarEl) return;

  const iniciales = nombreTecnico.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';

  try {
    const response = await fetch(`${BASE_URL}/api/usuarios/${tecnicoId}/foto`);
    if (response.ok) {
      const data = await response.json();
      if (data.foto) {
        techAvatarEl.innerHTML = `<img src="${data.foto}" alt="${escapeHTML(nombreTecnico)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        return;
      }
    }
  } catch (error) {
    console.error("Error al obtener la foto del técnico:", error);
  }

  // Fallback si no tiene foto o falla la petición
  techAvatarEl.textContent = iniciales;
}

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}