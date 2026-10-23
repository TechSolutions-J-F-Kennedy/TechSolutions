const API_URL = 'http://localhost:23461/api/productos-stock';
// Mantiene los nombres de los campos sincronizados con la tabla y la API.
const camposEditables = [
  'codigo_sku',
  'codigo_qr',
  'nombre',
  'descripcion',
  'stock_actual',
  'stock_minimo'
];
let productosActuales = [];

// Lee la respuesta JSON y convierte las respuestas HTTP fallidas en errores visibles.
const obtenerRespuesta = async (respuesta) => {
  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new Error('La API devolvió una respuesta no válida.');
  }

  if (!respuesta.ok) {
    throw new Error(datos.error || 'No se pudo completar la operación.');
  }

  return datos;
};

// Muestra errores de red o validación en el recuadro de la interfaz.
const mostrarError = (mensaje) => {
  const errorBox = document.getElementById('error-box');
  errorBox.textContent = mensaje;
  errorBox.hidden = false;
};

// Oculta el error anterior antes de iniciar otra operación.
const limpiarError = () => {
  const errorBox = document.getElementById('error-box');
  errorBox.textContent = '';
  errorBox.hidden = true;
};

// Crea celdas con texto (no HTML) para mostrar de forma segura los datos de la API.
const crearCelda = (valor) => {
  const celda = document.createElement('td');
  celda.textContent = valor ?? '';
  return celda;
};

const crearBoton = (texto, accion, clase = '') => {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = texto;
  boton.dataset.action = accion;
  if (clase) boton.className = clase;
  return boton;
};

// Vuelve a dibujar la tabla con los productos recibidos, incluyendo sus acciones.
const renderProductos = (productos) => {
  const tbody = document.getElementById('cuerpo-tabla');
  tbody.replaceChildren();
  productosActuales = productos;

  if (productos.length === 0) {
    const fila = document.createElement('tr');
    const celda = crearCelda('No se encontraron productos.');
    celda.colSpan = 8;
    fila.appendChild(celda);
    tbody.appendChild(fila);
    return;
  }

  productos.forEach((producto) => {
    const fila = document.createElement('tr');
    fila.dataset.id = producto.id;
    fila.append(
      crearCelda(producto.id),
      crearCelda(producto.codigo_sku),
      crearCelda(producto.codigo_qr),
      crearCelda(producto.nombre),
      crearCelda(producto.descripcion),
      crearCelda(producto.stock_actual),
      crearCelda(producto.stock_minimo)
    );

    const acciones = document.createElement('td');
    acciones.className = 'acciones';
    acciones.append(
      crearBoton('Modificar', 'editar'),
      crearBoton('Eliminar', 'eliminar', 'boton-peligro')
    );
    fila.appendChild(acciones);
    tbody.appendChild(fila);
  });
};

// Consulta la API con los filtros actuales y actualiza la tabla y el estado de la página.
const cargarProductos = async (mensaje = '') => {
  limpiarError();
  const estado = document.getElementById('estado');
  estado.textContent = 'Cargando productos...';

  const parametros = new URLSearchParams(new FormData(document.getElementById('form-filtros')));
  const query = parametros.toString();

  try {
    const respuesta = await fetch(query ? `${API_URL}?${query}` : API_URL);
    const datos = await obtenerRespuesta(respuesta);
    const productos = datos.payload;
    if (!Array.isArray(productos)) {
      throw new Error('La API devolvió un inventario con formato no válido.');
    }

    renderProductos(productos);
    estado.textContent = mensaje || `${productos.length} producto(s) encontrado(s).`;
  } catch (error) {
    console.error('Error al cargar inventario:', error);
    document.getElementById('cuerpo-tabla').replaceChildren();
    const fila = document.createElement('tr');
    const celda = crearCelda('No se pudo cargar el inventario.');
    celda.colSpan = 8;
    fila.appendChild(celda);
    document.getElementById('cuerpo-tabla').appendChild(fila);
    estado.textContent = '';
    mostrarError(error.message);
  }
};

// Convierte los campos del formulario de alta en el objeto esperado por el backend.
const leerProducto = (formulario) => {
  const datos = new FormData(formulario);
  return {
    codigo_sku: String(datos.get('codigo_sku')).trim(),
    codigo_qr: String(datos.get('codigo_qr')).trim(),
    nombre: String(datos.get('nombre')).trim(),
    descripcion: String(datos.get('descripcion')).trim(),
    stock_actual: Number(datos.get('stock_actual')),
    stock_minimo: Number(datos.get('stock_minimo'))
  };
};

// Envía altas y cambios como JSON y valida la respuesta del servidor.
const enviarProducto = async (url, metodo, producto) => {
  const respuesta = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });
  return obtenerRespuesta(respuesta);
};

// Cambia temporalmente las celdas del producto por campos editables.
const iniciarEdicion = (fila, producto) => {
  camposEditables.forEach((campo, indice) => {
    const celda = fila.cells[indice + 1];
    const entrada = document.createElement('input');
    entrada.name = campo;
    entrada.value = producto[campo] ?? '';
    entrada.setAttribute('aria-label', campo.replace(/_/g, ' '));

    if (campo.startsWith('stock_')) {
      entrada.type = 'number';
      entrada.min = '0';
      entrada.step = '1';
      entrada.required = true;
    }
    if (campo === 'codigo_sku' || campo === 'nombre') entrada.required = true;
    celda.replaceChildren(entrada);
  });

  const acciones = fila.cells[fila.cells.length - 1];
  acciones.replaceChildren(
    crearBoton('Guardar', 'guardar'),
    crearBoton('Cancelar', 'cancelar', 'boton-secundario')
  );
};

// Valida y envía los cambios de una fila; después recarga la lista actualizada.
const guardarEdicion = async (fila, producto) => {
  const entradas = [...fila.querySelectorAll('input[name]')];
  if (entradas.some((entrada) => !entrada.reportValidity())) return;

  const actualizado = { ...producto };
  entradas.forEach((entrada) => {
    actualizado[entrada.name] = entrada.type === 'number'
      ? Number(entrada.value)
      : entrada.value.trim();
  });

  try {
    limpiarError();
    await enviarProducto(`${API_URL}/${encodeURIComponent(producto.id)}`, 'PATCH', actualizado);
    await cargarProductos('Producto actualizado.');
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    mostrarError(error.message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const formFiltros = document.getElementById('form-filtros');
  const formAgregar = document.getElementById('form-agregar');
  const panelAgregar = document.getElementById('panel-agregar');
  const botonCerrarAgregar = document.getElementById('cerrar-panel-agregar');
  const tbody = document.getElementById('cuerpo-tabla');

  // Intercepta el envío normal para filtrar sin recargar la página.
  formFiltros.addEventListener('submit', (evento) => {
    evento.preventDefault();
    cargarProductos();
  });

  // Borra los criterios actuales y vuelve a consultar todo el inventario.
  formFiltros.addEventListener('reset', (evento) => {
    evento.preventDefault();
    formFiltros.elements.nombre.value = '';
    formFiltros.elements.codigo.value = '';
    formFiltros.elements.stock_max.value = '';
    cargarProductos();
  });

  // Los accesos rápidos reutilizan el mismo filtro de stock máximo.
  document.querySelectorAll('[data-stock-max]').forEach((boton) => {
    boton.addEventListener('click', () => {
      formFiltros.elements.nombre.value = '';
      formFiltros.elements.codigo.value = '';
      formFiltros.elements.stock_max.value = boton.dataset.stockMax;
      cargarProductos();
    });
  });

  // Registra un producto y cierra el panel solamente cuando la API confirma el alta.
  formAgregar.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formAgregar.reportValidity()) return;

    try {
      limpiarError();
      await enviarProducto(API_URL, 'POST', leerProducto(formAgregar));
      formAgregar.reset();
      document.getElementById('panel-agregar').open = false;
      await cargarProductos('Producto agregado.');
    } catch (error) {
      console.error('Error al agregar producto:', error);
      mostrarError(error.message);
    }
  });

  // Cierra el panel de alta conservando los datos escritos por si se vuelve a abrir.
  botonCerrarAgregar.addEventListener('click', () => {
    panelAgregar.open = false;
  });

  // Gestiona las acciones de todas las filas desde un único listener en la tabla.
  tbody.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('button[data-action]');
    if (!boton) return;

    const fila = boton.closest('tr');
    const producto = productosActuales.find((item) => String(item.id) === fila.dataset.id);
    if (!producto) return;

    if (boton.dataset.action === 'editar') {
      iniciarEdicion(fila, producto);
      return;
    }
    if (boton.dataset.action === 'cancelar') {
      // Restaura los valores originales y descarta los cambios sin guardar.
      renderProductos(productosActuales);
      return;
    }
    if (boton.dataset.action === 'guardar') {
      await guardarEdicion(fila, producto);
      return;
    }
    if (boton.dataset.action === 'eliminar') {
      if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;

      try {
        limpiarError();
        // El backend aplica borrado lógico y la lista se vuelve a consultar al confirmar.
        await obtenerRespuesta(await fetch(`${API_URL}/${encodeURIComponent(producto.id)}`, {
          method: 'DELETE'
        }));
        await cargarProductos('Producto eliminado del inventario.');
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        mostrarError(error.message);
      }
    }
  });

  cargarProductos();
});
