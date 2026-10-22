const BASE_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  const usuarioGuardado = localStorage.getItem('usuario');
  if (!usuarioGuardado) {
    alert('Debes iniciar sesión para chatear.');
    window.location.href = 'index.html';
    return;
  }
  const usuario = JSON.parse(usuarioGuardado);
  const tecnicoId = localStorage.getItem('chatActivo_tecnicoId') || '1';
  const nombreTecnico = localStorage.getItem('chatActivo_nombreTecnico') || 'Técnico';

  // Mostrar datos del técnico
  document.getElementById('chat-tech-name').textContent = nombreTecnico;
  const techAvatarEl = document.getElementById('chat-tech-avatar');
  if (techAvatarEl) {
    techAvatarEl.textContent = nombreTecnico.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
  }

  document.getElementById('btn-back-chat').addEventListener('click', () => window.history.back());

  const inputMensaje = document.getElementById('mensaje-input');
  const btnEnviar = document.getElementById('btn-enviar-mensaje');
  const contenedorMensajes = document.getElementById('chat-messages-container');

  // 1. Cargar historial inicial de mensajes desde la BD
  async function cargarHistorial() {
    try {
      const res = await fetch(`${BASE_URL}/api/mensajes/${usuario.id}/${tecnicoId}`);
      const mensajes = await res.json();

      if (res.ok) {
        contenedorMensajes.innerHTML = '';
        mensajes.forEach(msg => {
          agregarBurbujaMensaje(msg.remitente === 'usuario', msg.mensaje, msg.hora);
        });
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
        alert('No se pudo enviar el mensaje.');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
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
  inputMensaje.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarMensaje();
  });

  // Cargar al iniciar
  cargarHistorial();

  // Opcional: Polling (consultar nuevos mensajes cada 4 segundos para simular tiempo real sin Socket.io)
  setInterval(cargarHistorial, 4000);
});

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
} 