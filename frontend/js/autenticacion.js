
lucide.createIcons();

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');
const formSubtitle = document.getElementById('form-subtitle');

// Alternar a Registro
if (goToRegister) {
  goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    formSubtitle.textContent = 'Creá tu cuenta completando el siguiente formulario.';
  });
}

// Alternar a Login
if (goToLogin) {
  goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    formSubtitle.textContent = 'Ingresá tus credenciales para acceder a la plataforma.';
  });
}


// front/auth.js

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const telefono = document.getElementById('reg-phone') ? document.getElementById('reg-phone').value : '';

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    try {
      // Petición a la ruta configurada en tu MVC
      const response = await fetch('http://localhost:3000/api/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, telefono })
      });

      const data = await response.json();

      if (response.ok) {
        alert('¡Cuenta creada exitosamente!');
        document.getElementById('go-to-login').click();
      } else {
        alert('Error: ' + (data.error || 'No se pudo crear la cuenta'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-user').value;
    const password = document.getElementById('login-password').value;

    try {
      // Petición a la ruta de sesión
      const response = await fetch('http://localhost:3000/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('¡Bienvenido, ' + data.usuario.nombre + '!');
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = 'perfil.html';
      } else {
        alert('Error: ' + (data.error || 'Credenciales inválidas'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });
}

