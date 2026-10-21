const API_URL = location.port === '3000' ? '' : 'http://localhost:3000'; // '' = mismo servidor (sirve desde el celular)
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

if (!tecnico || tecnico.rol !== 'tecnico' || !tecnico.id) {
    window.location.href = 'index.html';
} else {
    delete tecnico.password;
    localStorage.setItem('usuario', JSON.stringify(tecnico));

    const vista = campo('vista');
    const formulario = campo('form');
    const confirmacion = campo('cf');
    const botonConfirmar = campo('ok');

    function mostrarPerfil() {
        const nombreCompleto = [tecnico.nombre_real, tecnico.apellido].filter(Boolean).join(' ') || 'Técnico';
        campo('av').innerHTML = `${escaparHTML(nombreCompleto.charAt(0).toUpperCase())}`;
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
        if (!campo('categoria').value.trim()) {
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
            categoria: campo('categoria').value.trim(),
            telefono: campo('telefono').value.trim()
        };
        if (campo('password').value) cambios.password = campo('password').value;

        try {
            const respuesta = await fetch(
                `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/perfil`,
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

    mostrarPerfil();
    lucide.createIcons();
}
