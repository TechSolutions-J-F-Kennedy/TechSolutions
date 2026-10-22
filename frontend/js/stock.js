const API_URL = 'http://localhost:23461/api/productos-stock';

const renderProductos = (productos) => {
  const tbody = document.getElementById('cuerpo-tabla');
  const errorBox = document.getElementById('error-box');

  if (!tbody) return;

  tbody.innerHTML = '';

  if (!Array.isArray(productos) || productos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No hay productos registrados en la tabla productos_stock.</td>
      </tr>
    `;
    errorBox.style.display = 'none';
    return;
  }

  productos.forEach((producto) => {
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${producto.id ?? ''}</td>
      <td>${producto.codigo_sku ?? ''}</td>
      <td>${producto.codigo_qr ?? ''}</td>
      <td>${producto.nombre ?? ''}</td>
      <td>${producto.descripcion ?? ''}</td>
      <td>${producto.stock_actual ?? 0}</td>
      <td>${producto.stock_minimo ?? 0}</td>
      <td><button type="button">seleccionar</button></td>
    `;

    tbody.appendChild(fila);
  });

  errorBox.style.display = 'none';
};

const mostrarError = (mensaje) => {
  const tbody = document.getElementById('cuerpo-tabla');
  const errorBox = document.getElementById('error-box');

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No se pudo cargar el inventario.</td>
      </tr>
    `;
  }

  if (errorBox) {
    errorBox.textContent = mensaje;
    errorBox.style.display = 'block';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  fetch(API_URL)
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al consultar la base de datos');
      }

      renderProductos(data.payload || []);
    })
    .catch((error) => {
      console.error('Error al cargar inventario:', error);
      mostrarError(
        'No se pudo conectar con la API del backend. Verifica que el servidor esté corriendo y que la base de datos tenga la tabla productos_stock.'
      );
    });
});