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
      text: 'Debes iniciar sesión para ver tus chats.'
    }).then(() => {
      window.location.href = 'index.html';
    });
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
          const nombreTecnico = chat.nombre_tecnico || 'Técnico';
          const idTecnico = chat.tecnico_id;
          const iniciales = nombreTecnico.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TC';
          
          const fotoTecnico = chat.foto_tecnico || chat.foto;
          const avatarHTML = fotoTecnico
            ? `<img src="${fotoTecnico}" alt="${escapeHTML(nombreTecnico)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : `<div style="width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; background: var(--border, #334155); color: #fff;">${escapeHTML(iniciales)}</div>`;

          const card = document.createElement('div');
          card.className = 'tech-card';
          card.style.cursor = 'pointer';
          
          card.innerHTML = `
            <div class="tech-header">
              <div class="tech-avatar">
                <a href="tecnico-datos.html?id=${encodeURIComponent(idTecnico)}" class="link-tecnico-perfil" title="Ver perfil" style="display: block; width: 100%; height: 100%; text-decoration: none; color: inherit;">
                  ${avatarHTML}
                </a>
              </div>
              <div class="tech-details">
                <h4>
                  <a href="tecnico-datos.html?id=${encodeURIComponent(idTecnico)}" class="link-tecnico-perfil" style="text-decoration: none; color: inherit;" title="Ver perfil">
                    ${escapeHTML(nombreTecnico)}
                  </a>
                </h4>
                <p class="tech-spec" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                  ${escapeHTML(chat.ultimo_mensaje || 'Abrir conversación...')}
                </p>
              </div>
              <button class="btn-chat-action" title="Abrir chat">
                <i data-lucide="message-square"></i>
              </button>
            </div>
          `;

          // Clic en la tarjeta abre la conversación
          card.onclick = () => {
            localStorage.setItem('chatActivo_tecnicoId', chat.tecnico_id);
            localStorage.setItem('chatActivo_nombreTecnico', nombreTecnico);
            window.location.href = 'chat-usuario.html';
          };

          // Evita que la redirección al perfil abra también el chat
          const enlacesPerfil = card.querySelectorAll('.link-tecnico-perfil');
          enlacesPerfil.forEach(enlace => {
            enlace.onclick = (e) => {
              e.stopPropagation();
            };
          });

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

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}