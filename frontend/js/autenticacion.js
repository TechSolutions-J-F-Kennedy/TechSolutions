const API_URL = location.port === '3000' ? '' : 'http://localhost:3000'; // '' = mismo servidor (sirve desde el celular)

// Página de inicio según el rol guardado en la tabla Usuarios
const INICIO_POR_ROL = {
    tecnico: 'inicio.html'
};

const loginForm = document.getElementById('login-form');
const botonLogin = document.getElementById('btn-login');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('u').value.trim();
    const password = document.getElementById('p').value;
    botonLogin.disabled = true;

    try {
        // Petición a la ruta de sesión (consulta la tabla Usuarios)
        const response = await fetch(`${API_URL}/api/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert('Error: ' + (data.error || 'Credenciales inválidas'));
            return;
        }

        const destino = INICIO_POR_ROL[data.usuario.rol];
        if (!destino) {
            alert('Tu cuenta (' + data.usuario.rol + ') todavía no tiene acceso a esta aplicación.');
            return;
        }

        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = destino;
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
    } finally {
        botonLogin.disabled = false;
    }
});
