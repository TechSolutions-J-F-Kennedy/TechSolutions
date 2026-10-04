 // Inicializar iconos de Lucide
    lucide.createIcons();

    // Función para cambiar de Pestaña
    function switchTab(tabId, element) {
      // Ocultar todas las pestañas
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

      // Mostrar la seleccionada
      document.getElementById(tabId).classList.add('active');
      element.classList.add('active');
    }

document.addEventListener('DOMContentLoaded', () => {
  // 1. Obtener los datos del usuario guardados en el inicio de sesión
  const usuarioGuardado = localStorage.getItem('usuario');

  // Si no hay ningún usuario guardado en el navegador, redirigir al login
  if (!usuarioGuardado) {
    window.location.href = 'index.html';
    return;
  }

  // Convertir el texto JSON de vuelta a un objeto JavaScript
  const usuario = JSON.parse(usuarioGuardado);

  // 2. Rellenar la Tarjeta de Perfil Superior
  const nameElement = document.querySelector('.user-name');
  const emailElement = document.querySelector('.user-email');
  const avatarElement = document.querySelector('.profile-avatar');

  if (nameElement) nameElement.textContent = usuario.nombre;
  if (emailElement) emailElement.textContent = usuario.email;

  // Generar las iniciales del usuario para el Avatar (ej.: "Juan Pérez" -> "JP")
  if (avatarElement && usuario.nombre) {
    const iniciales = usuario.nombre
      .split(' ')
      .map(palabra => palabra[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    avatarElement.textContent = iniciales;
  }

  // 3. Rellenar los campos del Formulario de Datos Personales
  const inputUsername = document.getElementById('username');
  const inputEmail = document.getElementById('email');
  const inputPhone = document.getElementById('phone');

  if (inputUsername) inputUsername.value = usuario.nombre;
  if (inputEmail) inputEmail.value = usuario.email;
  if (inputPhone && usuario.telefono) inputPhone.value = usuario.telefono;

  // 4. Configurar el botón de Cerrar Sesión
  const logoutBtn = document.querySelector('.btn-danger-ghost');
  if (logoutBtn) {
    // Quitar el onclick inline y asignarlo mediante evento
    logoutBtn.removeAttribute('onclick');
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('usuario'); // Limpiar la sesión
      window.location.href = 'index.html'; // Redirigir al acceso
    });
  }
});