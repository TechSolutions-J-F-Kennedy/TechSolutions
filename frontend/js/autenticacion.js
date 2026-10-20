

const BASE_URL = "http://localhost:3000";
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

// Variable global para almacenar el objeto de la dirección seleccionada

let direccionSeleccionadaObj = null;

const inputAddress = document.getElementById('reg-address');
const suggestionsList = document.getElementById('address-suggestions');

if (inputAddress && suggestionsList) {
    let timeoutTimer;

    inputAddress.addEventListener('input', () => {
        clearTimeout(timeoutTimer);
        const query = inputAddress.value.trim();

        if (query.length < 4) {
            suggestionsList.innerHTML = '';
            direccionSeleccionadaObj = null;
            return;
        }

        timeoutTimer = setTimeout(async () => {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&addressdetails=1&limit=5`;

            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'KennedyTechSolutions/1.0' }
                });
                const data = await res.json();

                suggestionsList.innerHTML = '';

                data.forEach(place => {
                    const li = document.createElement('li');
                    li.className = 'suggestion-item';

                    const nombreCalle = place.address.road || place.name || 'Dirección';
                    const localidadProvincia = [
                        place.address.city || place.address.town || place.address.suburb || place.address.city_district,
                        place.address.state || 'Buenos Aires'
                    ].filter(Boolean).join(', ');

                    li.innerHTML = `
                        <div class="suggestion-icon"><i data-lucide="map-pin"></i></div>
                        <div class="suggestion-text">
                            <span class="street-name">${nombreCalle}</span>
                            <span class="location-name">${localidadProvincia}</span>
                        </div>
                    `;

                    li.onclick = () => {
                        inputAddress.value = place.display_name;
                        suggestionsList.innerHTML = '';

                        // Guardamos el objeto completo para el Submit
                        direccionSeleccionadaObj = {
                            direccion_completa: place.display_name,
                            latitud: place.lat,
                            longitud: place.lon
                        };
                    };

                    suggestionsList.appendChild(li);
                });

                if (window.lucide) lucide.createIcons();

            } catch (error) {
                console.error("Error al buscar direcciones:", error);
            }
        }, 400);
    });
}

// En el evento Submit del registro:
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

        // Si escribió algo pero no eligió de la lista, tomamos el texto directo
        const direccionFinal = direccionSeleccionadaObj || {
            direccion_completa: inputAddress ? inputAddress.value.trim() : ''
        };

        try {
            const response = await fetch(`${BASE_URL}/api/usuarios/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nombre, 
                    email, 
                    password, 
                    telefono,
                    direccion: direccionFinal 
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡Cuenta registrada exitosamente!');
                if (goToLogin) goToLogin.click();
            } else {
                alert('Error: ' + (data.error || 'No se pudo crear la cuenta'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo conectar con el servidor.');
        }
    });
}

// Login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-user').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch(`${BASE_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('¡Bienvenido, ' + data.usuario.nombre + '!');
        localStorage.setItem('usuario', JSON.stringify(data.usuario));

        // Redirecciones según el Rol
        if (data.usuario.rol === "usuario") {
          window.location.href = 'html/home.html';
        } else if (data.usuario.rol === "tecnico") {
          window.location.href = 'html/tecnico-dashboard.html'; // Ajustar ruta deseada
        } else if (data.usuario.rol === "deposito") {
          window.location.href = 'html/deposito-dashboard.html'; // Ajustar ruta deseada
        }
      } else {
        alert('Error: ' + (data.error || 'Credenciales inválidas'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });
}

