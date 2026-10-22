const BASE_URL = "http://localhost:3000";

// Inicializar íconos de Lucide
if (window.lucide) {
    lucide.createIcons();
}

// Función global para cambiar de Pestaña
window.switchTab = function (tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
        window.location.href = '../index.html';
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    // 2. Rellenar datos principales del perfil
    const nameElement = document.querySelector('.user-name');
    const emailElement = document.querySelector('.user-email');
    const avatarElement = document.querySelector('.profile-avatar');

    if (nameElement) nameElement.textContent = usuario.nombre;
    if (emailElement) emailElement.textContent = usuario.email;

    if (avatarElement && usuario.nombre) {
        const iniciales = usuario.nombre
            .split(' ')
            .map(p => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        avatarElement.textContent = iniciales;
    }

    // 3. Rellenar campos de la pestaña 'Datos'
    const inputUsername = document.getElementById('username');
    const inputEmail = document.getElementById('email');
    const inputPhone = document.getElementById('phone');

    if (inputUsername) inputUsername.value = usuario.nombre;
    if (inputEmail) inputEmail.value = usuario.email;
    if (inputPhone && usuario.telefono) inputPhone.value = usuario.telefono;

    // 4. Cargar y renderizar Direcciones Guardadas desde la BD
    await cargarDirecciones(usuario.id);

    // 5. Configurar Botón de Cerrar Sesión
    const logoutBtn = document.querySelector('.btn-danger-ghost');
    if (logoutBtn) {
        logoutBtn.removeAttribute('onclick');
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuario');
            window.location.href = '../index.html';
        });
    }
});

// Función para obtener y renderizar las direcciones
async function cargarDirecciones(usuarioId) {
    const addressListContainer = document.querySelector('.address-list');
    if (!addressListContainer) return;

    try {
        const response = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/direcciones`);
        const direcciones = await response.json();

        if (response.ok && direcciones.length > 0) {
            addressListContainer.innerHTML = ''; // Limpiar estáticos hardcodeados

            direcciones.forEach(dir => {
                const esPrincipal = dir.es_principal === 1;

                const cardHtml = `
                    <div class="address-card ${esPrincipal ? 'active' : ''}">
                        <div class="address-icon">
                            <i data-lucide="${dir.alias === 'Oficina' ? 'briefcase' : 'home'}"></i>
                        </div>
                        <div class="address-details">
                            <strong>${dir.alias || 'Dirección'} ${esPrincipal ? '(Principal)' : ''}</strong>
                            <p>${dir.direccion_completa}</p>
                        </div>
                        ${esPrincipal 
                            ? '<span class="check-badge"><i data-lucide="check"></i></span>' 
                            : '<button class="btn btn-ghost btn-icon-sm"><i data-lucide="more-vertical"></i></button>'
                        }
                    </div>
                `;
                addressListContainer.innerHTML += cardHtml;
            });

            if (window.lucide) lucide.createIcons();
        } else {
            addressListContainer.innerHTML = `
                <p style="color: var(--muted, #64748b); font-size: 13px; text-align: center; padding: 12px 0;">
                    No tienes direcciones guardadas.
                </p>
            `;
        }
    } catch (error) {
        console.error("Error cargando direcciones:", error);
    }
}