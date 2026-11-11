const API_URL = location.protocol === 'file:' ? 'http://localhost:3000'
    : location.port === '5500' ? `${location.protocol}//${location.hostname}:3000`
        : '';

const resultadoEntrega = document.getElementById('resultado-entrega');
const tokenEntrega = new URLSearchParams(location.hash.slice(1)).get('token');
if (location.protocol !== 'file:') history.replaceState(null, '', location.pathname);

async function confirmarEntregaInsumo() {
    if (!tokenEntrega || !/^[A-Za-z0-9_-]{43}$/.test(tokenEntrega)) {
        throw new Error('El código QR no es válido.');
    }

    const respuesta = await fetch(`${API_URL}/api/tecnicos/insumos/confirmar-entrega`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenEntrega })
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || 'No se pudo confirmar la entrega.');
    return datos;
}

confirmarEntregaInsumo()
    .then(({ producto, cantidad }) => {
        resultadoEntrega.textContent = `Entrega confirmada: ${producto} × ${cantidad}. El stock fue actualizado y el técnico recibirá la confirmación.`;
    })
    .catch((error) => {
        console.error('Error al confirmar la entrega escaneada:', error);
        resultadoEntrega.textContent = error.message || 'No se pudo confirmar la entrega.';
    });
