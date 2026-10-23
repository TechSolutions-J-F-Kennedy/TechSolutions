const BASE_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) lucide.createIcons();

  const usuarioGuardado = localStorage.getItem('usuario');
  if (!usuarioGuardado) {
    alert('Debes iniciar sesión para ver tus chats.');
    window.location.href = 'index.html';
    return;
  }
  const usuario = JSON.parse(usuarioGuardado);
  const contenedorChats = document.getElementById('chats-list-container');

  try {
    const res = await fetch(`${BASE_URL}/api/mensajes/chats/${usuario.id}`);
    const data = await res.json();

    if (res.ok) {
      const chats = data.chats || data.payload || [];
      contenedorChats.innerHTML = '';

      if (chats.length === 0) {
        contenedorChats.innerHTML = `
          <div style="text-align: center; padding: 40px 10px; color: var(--muted);">
            <i data-lucide="message-square-off" style="width: 36px; height: 36px; margin-bottom: 8px;"></i>
            <p>No tienes conversaciones recientes.</p>
          </div>
        `;
      } else {
        chats.forEach(chat => {
          const iniciales = chat.nombre_tecnico ? chat.nombre_tecnico.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'TC';
          
          const card = document.createElement('div');
          card.className = 'tech-card';
          card.innerHTML = `
            <div class="tech-header">
              <div class="tech-avatar">${iniciales}</div>
              <div class="tech-details">
                <h4>${chat.nombre_tecnico || 'Técnico'}</h4>
                <p class="tech-spec" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                  ${chat.ultimo_mensaje || 'Abrir conversación...'}
                </p>
              </div>
              <button class="btn-chat-action" title="Abrir chat">
                <i data-lucide="message-square"></i>
              </button>
            </div>
          `;

          card.onclick = () => {
            localStorage.setItem('chatActivo_tecnicoId', chat.tecnico_id);
            localStorage.setItem('chatActivo_nombreTecnico', chat.nombre_tecnico);
            window.location.href = 'chat.html';
          };

          contenedorChats.appendChild(card);
        });
      }
      if (window.lucide) lucide.createIcons();
    } else {
      contenedorChats.innerHTML = '<p style="text-align:center; color: var(--muted);">No se pudieron cargar los chats.</p>';
    }
  } catch (error) {
    console.error('Error al obtener los chats:', error);
    contenedorChats.innerHTML = '<p style="text-align:center; color: red;">Error de conexión con el servidor.</p>';
  }
});