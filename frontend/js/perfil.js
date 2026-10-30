const API_URL = location.protocol === 'file:' || location.port === '5500' ? 'http://localhost:3000' : ''; // '' = el mismo servidor que entregó la página (compu, celu o internet)
const campo = (id) => document.getElementById(id);

let tecnico;
try {
    tecnico = JSON.parse(localStorage.getItem('usuario'));
} catch (error) {
    console.error('No se pudieron leer los datos del técnico:', error);
}

const escaparHTML = (valor) => String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[caracter]));

// El perfil sirve para el técnico y para el cliente (rol 'usuario')
const esTecnico = tecnico?.rol === 'tecnico';

if (!tecnico || !['tecnico', 'usuario'].includes(tecnico.rol) || !tecnico.id) {
    window.location.href = 'index.html';
} else {
    delete tecnico.password;
    localStorage.setItem('usuario', JSON.stringify(tecnico));

    const vista = campo('vista');
    const formulario = campo('form');
    const confirmacion = campo('cf');
    const botonConfirmar = campo('ok');
    let fotoPerfil = null;

    // El cliente no tiene categoría y usa su propia ruta para guardar el perfil
    if (!esTecnico) {
        campo('chip-rol').innerHTML = '<i data-lucide="user-round"></i> Cliente';
        campo('fila-categoria').hidden = true;
        campo('campo-categoria').hidden = true;
    }

    function mostrarPerfil() {
        const nombreCompleto = [tecnico.nombre_real, tecnico.apellido].filter(Boolean).join(' ') || 'Técnico';
        campo('av').innerHTML = fotoPerfil
            ? `<img src="${fotoPerfil}" alt="Foto de perfil">`
            : `${escaparHTML(nombreCompleto.charAt(0).toUpperCase())}`;
        campo('quitar-foto').hidden = !fotoPerfil;
        campo('n').innerHTML = `${escaparHTML(nombreCompleto)}`;
        campo('vr').innerHTML = `${escaparHTML(tecnico.rol)}`;
        campo('ve').innerHTML = `${escaparHTML(tecnico.email || 'No disponible')}`;
        campo('vc').innerHTML = `${escaparHTML(tecnico.categoria || 'No disponible')}`;
        campo('vt').innerHTML = `${escaparHTML(tecnico.telefono || 'No disponible')}`;
    }

    function mostrarEdicion(activo) {
        vista.hidden = activo;
        formulario.hidden = !activo;
        campo('bv').hidden = activo;
        campo('be').hidden = !activo;
    }

    campo('ed').addEventListener('click', () => {
        campo('nombre-real').value = tecnico.nombre_real || '';
        campo('apellido').value = tecnico.apellido || '';
        campo('email').value = tecnico.email || '';
        campo('categoria').value = tecnico.categoria || '';
        campo('telefono').value = tecnico.telefono || '';
        campo('password').value = '';
        mostrarEdicion(true);
    });

    campo('cn').addEventListener('click', () => mostrarEdicion(false));
    campo('sv').addEventListener('click', () => {
        if (!campo('nombre-real').value.trim()) {
            campo('nombre-real').focus();
            return;
        }
        if (!campo('apellido').value.trim()) {
            campo('apellido').focus();
            return;
        }
        if (!campo('email').validity.valid || !campo('email').value.trim()) {
            campo('email').focus();
            return;
        }
        if (esTecnico && !campo('categoria').value.trim()) {
            campo('categoria').focus();
            return;
        }
        confirmacion.classList.add('on');
    });

    campo('no').addEventListener('click', () => confirmacion.classList.remove('on'));
    confirmacion.addEventListener('click', (evento) => {
        if (evento.target === confirmacion) confirmacion.classList.remove('on');
    });

    botonConfirmar.addEventListener('click', async () => {
        botonConfirmar.disabled = true;
        const cambios = {
            nombre_real: campo('nombre-real').value.trim(),
            apellido: campo('apellido').value.trim(),
            email: campo('email').value.trim(),
            telefono: campo('telefono').value.trim()
        };
        if (esTecnico) cambios.categoria = campo('categoria').value.trim();
        if (campo('password').value) cambios.password = campo('password').value;

        try {
            const respuesta = await fetch(
                `${API_URL}/api/${esTecnico ? 'tecnicos' : 'clientes'}/${encodeURIComponent(tecnico.id)}/perfil`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cambios)
                }
            );
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudo actualizar el perfil.');
            }

            tecnico = { ...tecnico, ...datos.usuario };
            delete tecnico.password;
            localStorage.setItem('usuario', JSON.stringify(tecnico));
            campo('password').value = '';
            mostrarPerfil();
            mostrarEdicion(false);
            confirmacion.classList.remove('on');
        } catch (error) {
            console.error('Error al guardar el perfil:', error);
            window.alert(error.message || 'No se pudo guardar el perfil.');
        } finally {
            botonConfirmar.disabled = false;
        }
    });

    campo('ce').addEventListener('click', () => {
        localStorage.removeItem('usuario');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    /* ===== Foto de perfil ===== */
    const urlFoto = `${API_URL}/api/usuarios/${encodeURIComponent(tecnico.id)}/foto`;

    async function guardarFoto(foto) {
        const respuesta = await fetch(urlFoto, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foto })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || 'No se pudo guardar la foto.');
        fotoPerfil = datos.foto;
        mostrarPerfil();
    }

    campo('foto-input').addEventListener('change', async (evento) => {
        const archivo = evento.target.files[0];
        evento.target.value = '';
        if (!archivo) return;

        try {
            await guardarFoto(await achicarImagen(archivo));
        } catch (error) {
            console.error('Error al cambiar la foto de perfil:', error);
            window.alert(error.message || 'No se pudo cambiar la foto.');
        }
    });

    campo('quitar-foto').addEventListener('click', async () => {
        if (!window.confirm('¿Querés quitar tu foto de perfil?')) return;
        try {
            await guardarFoto(null);
        } catch (error) {
            console.error('Error al quitar la foto de perfil:', error);
            window.alert(error.message || 'No se pudo quitar la foto.');
        }
    });

    async function cargarFoto() {
        try {
            const respuesta = await fetch(urlFoto);
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error);
            fotoPerfil = datos.foto;
            mostrarPerfil();
        } catch (error) {
            console.error('No se pudo cargar la foto de perfil:', error);
        }
    }

    /* ===== Mi zona de trabajo (solo técnicos) ===== */
    const urlUbicacion = `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/ubicacion`;

    function mostrarUbicacion(ubicacion) {
        const tiene = ubicacion && ubicacion.latitud !== null && ubicacion.longitud !== null;
        campo('zona-direccion').textContent = tiene
            ? ubicacion.direccion_completa
            : 'Todavía no marcaste dónde trabajás: no te van a llegar pedidos cercanos.';
        campo('zona-mapa').hidden = !tiene;
        if (tiene) {
            campo('zona-mapa').src =
                `https://maps.google.com/maps?q=${encodeURIComponent(`${ubicacion.latitud},${ubicacion.longitud}`)}&z=15&output=embed`;
        }
    }

    async function guardarUbicacion(datos, boton) {
        boton.disabled = true;
        campo('zona-direccion').textContent = 'Buscando en el mapa...';
        try {
            const respuesta = await fetch(urlUbicacion, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo guardar tu ubicación.');
            mostrarUbicacion(resultado.payload);
            campo('zona-form').hidden = true;
        } catch (error) {
            console.error('Error al guardar la ubicación:', error);
            window.alert(error.message || 'No se pudo guardar tu ubicación.');
            cargarUbicacion();
        } finally {
            boton.disabled = false;
        }
    }

    async function cargarUbicacion() {
        try {
            const respuesta = await fetch(urlUbicacion);
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error);
            mostrarUbicacion(datos.payload);
        } catch (error) {
            console.error('No se pudo cargar la ubicación:', error);
            campo('zona-direccion').textContent = 'No se pudo cargar tu ubicación.';
        }
    }

    // GPS del celular: la ubicación más exacta (necesita https o localhost, y permiso del usuario)
    campo('zona-gps').addEventListener('click', () => {
        const boton = campo('zona-gps');
        if (!navigator.geolocation) {
            window.alert('Este navegador no puede usar el GPS. Escribí tu dirección.');
            return;
        }
        boton.disabled = true;
        campo('zona-direccion').textContent = 'Buscando tu ubicación...';
        navigator.geolocation.getCurrentPosition(
            (posicion) => guardarUbicacion(
                { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude },
                boton
            ),
            (error) => {
                boton.disabled = false;
                cargarUbicacion();
                window.alert(error.code === error.PERMISSION_DENIED
                    ? 'No diste permiso para usar tu ubicación. Activalo en el navegador o escribí tu dirección.'
                    : 'No se pudo obtener tu ubicación. Probá de nuevo o escribí tu dirección.');
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    });

    campo('zona-escribir').addEventListener('click', () => {
        campo('zona-form').hidden = !campo('zona-form').hidden;
        if (!campo('zona-form').hidden) campo('zona-input').focus();
    });

    campo('zona-form').addEventListener('submit', (evento) => {
        evento.preventDefault();
        const direccion = campo('zona-input').value.trim();
        if (!direccion) return;
        guardarUbicacion({ direccion }, evento.submitter || campo('zona-form').querySelector('button'));
    });

    if (esTecnico) {
        campo('zona').hidden = false;
        cargarUbicacion();
    }

    mostrarPerfil();
    cargarFoto();
    lucide.createIcons();
}
