const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('u').value;
    const password = document.getElementById('p').value;

    try {
      // Petición a la ruta de sesión
        const response = await fetch('http://localhost:3000/api/tecnicos/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
        alert('¡Bienvenido, ' + data.usuario.nombre + '!');
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        if (data.usuario.rol==="usuario"){
        window.location.href = 'home.html';
        }
        else if(data.usuario.rol==="tecnico"){
            window.location.href = 'inicio.html';
        }
        else if(data.usuario.rol==="deposito"){
        
        }
    } else {
        alert('Error: ' + (data.error || 'Credenciales inválidas'));
    }
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
    }
});