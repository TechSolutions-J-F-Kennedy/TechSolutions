# 📱 Guía Arquitectónica: Implementación del Lector QR en Inventario y Depósito

**Destinatario**: Lucas Barrionuevo (`@Faceleskhan22` / Subgrupo A3) — Responsable de Depósito y Lector QR  
**Contexto**: Módulo de Control de Stock y Herramientas (`frontend/herramientas.html`, `frontend/inventario.html`, `backend/src/routes/`, `backend/src/controllers/`)  
**Proyecto**: Kennedy TechSolutions — 7º 5ta (E.E.S.T. Nº 5)

---

## 🧭 1. El Concepto Fundamental: ¿Qué es y para qué sirve un código QR en un sistema real?

En tus pruebas iniciales lograste encender la cámara y leer el texto dentro de `frontend/Alaska-prueba/QR.html`. ¡Ese es un buen primer paso! Sin embargo, actualmente el lector solo muestra una frase en pantalla (`Código detectado: ...`) dentro de una carpeta aislada llamada "Alaska".

En una aplicación profesional de gestión técnica:
* Un código QR **NO es un link web de fantasía**. Es una **etiqueta física** pegada en la caja de un repuesto, router, bobina de cable o maletín de herramientas.
* El código QR contiene un identificador único del producto: generalmente su **código SKU** (ej: `SKU-RT-WIFI6`, `CAB-UTP-CAT6`) o su **ID numérico** de base de datos.
* El objetivo del escáner en el celular no es "ver el texto", sino **automatizar un movimiento de inventario** en el depósito sin que el técnico tenga que escribir en un teclado.

---

## 🏗️ 2. El Circuito Completo de Arquitectura

El flujo completo del módulo debe conectar la cámara con la base de datos en Aiven mediante los siguientes pasos:

```
[ 1. Escaneo en Celular ]
      │ La cámara lee la etiqueta QR pegada en la estantería
      ▼
[ 2. Evento en JavaScript ]
      │ Html5QrcodeScanner detecta el texto: "SKU-RT-WIFI6"
      ▼
[ 3. Consulta a la API (Fetch) ]
      │ GET /api/productos/codigo/SKU-RT-WIFI6
      ▼
[ 4. Backend Express + MySQL (Aiven) ]
      │ SELECT * FROM productos_stock WHERE codigo_sku = ?
      ▼
[ 5. Respuesta en Pantalla ]
      │ Muestra la Tarjeta del Producto:
      │ - Nombre: "Router TP-Link Archer AX10"
      │ - Stock Actual: 14 unidades
      │ - Acciones: [ + Ingreso ] ó [ - Retiro para Servicio ]
      ▼
[ 6. Actualización de Stock ]
      │ Al pulsar Ingreso/Retiro, envía POST /api/productos/:id/movimiento
      │ y actualiza la cantidad en la base de datos central
```

---

## 📁 3. Mapa de Archivos a Integrar (Basta de carpetas aisladas)

Para que el trabajo sea parte oficial de TechSolutions y no quede como una prueba suelta en `Alaska-prueba/`, hay que integrarlo en la estructura real del proyecto:

| Archivo | Responsabilidad / Cambio a Realizar |
| :--- | :--- |
| `frontend/herramientas.html` (o `inventario.html`) | Integrar la interfaz del escáner dentro de la plantilla oficial de TechSolutions (usando el navbar y pie de página del proyecto, no de "Alaska"). |
| `frontend/css/herramientas.css` | Aplicar la paleta de colores y estilos corporativos de Kennedy TechSolutions (`docs/kennedy-tech-solutions-guia-estilos.html`). |
| `frontend/js/qr-scanner.js` *(Nuevo)* | Script modular que inicializa la cámara, captura el código y dispara la búsqueda del producto. |
| `frontend/js/stock.js` | Modificar la lógica que actualmente busca un archivo de prueba `datos.json` para que consuma la API real de Express. |
| `backend/src/routes/productos.routes.js` | Rutas para obtener productos por SKU/código y registrar movimientos de stock. |
| `backend/src/controllers/productos.controller.js` | Lógica de negocio: verificar existencia, validar que no se retiren más unidades de las disponibles. |
| `backend/src/models/productos.model.js` | Consultas SQL sobre la tabla `productos_stock` en Aiven. |
| `frontend/Alaska-prueba/` | **Eliminar esta carpeta**: una vez mudada la lógica, debe purgarse para mantener el repositorio limpio. |

---

## 🧠 4. Guía Conceptual de Implementación (Paso a Paso)

### Paso 1: Diseñar la Experiencia del Usuario (UI) en el Frontend
En tu pantalla de escaneo (`herramientas.html` o `inventario.html`) debés prever 3 componentes visuales:
1. **El Visor de Cámara**: El recuadro interactivo donde se visualiza el video en vivo.
2. **El Fallback Manual**: En un depósito a veces no hay buena luz o la cámara no enfoca. Debe existir un campo de texto `<input type="text" placeholder="Ingresar SKU manualmente">` con un botón "Buscar". Tanto el escáner como el input manual deben llamar a la misma función de búsqueda.
3. **El Panel/Modal de Resultado**: Un contenedor oculto que se hace visible únicamente cuando se encuentra un producto, mostrando sus datos y los botones para sumar o restar stock.

### Paso 2: La Captura del Código y la Consulta Asíncrona
* En tu callback exitoso del lector (`lector.render(onScanSuccess)`):
  * **Pregunta clave**: ¿Qué pasa si el lector sigue leyendo 10 veces por segundo el mismo código mientras la cámara sigue prendida?
  * **Solución**: Apenas se detecta un código válido, pausá o detené el escaneo (`lector.pause()` o `lector.clear()`) para no saturar de peticiones al servidor.
  * Tomá el texto leído y hacé un `fetch` a tu endpoint de Express pasando el código.

### Paso 3: La API y la Base de Datos (Aiven)
* Revisá la estructura definida en `docs/guia-base-de-datos.md`:
  * Tabla **`productos_stock`**: columnas `id`, `codigo_sku`, `codigo_qr`, `nombre`, `descripcion`, `stock_actual`, `stock_minimo`.
* Tu endpoint en Express debe buscar coincidencias tanto por `codigo_qr` como por `codigo_sku`.
* Si el producto **existe**, devuelve el JSON con los datos y el status `200 OK`.
* Si **no existe**, devuelve un `404 Not Found` con un mensaje claro: *"Producto no registrado en depósito"*.

### Paso 4: Movimiento de Stock (Ingreso / Egreso)
Cuando el operario ve el producto en pantalla y elige, por ejemplo, "Retirar 2 unidades para orden técnica":
* El frontend envía una petición `POST` o `PATCH` con la cantidad y el tipo de movimiento.
* El backend valida una regla de negocio fundamental: **¿Hay suficiente stock disponible?**
  * Si `stock_actual - cantidad < 0`, debe rechazar la operación con un error 400.
  * Si es válido, ejecuta el `UPDATE` en MySQL restando o sumando la cantidad y devuelve el nuevo saldo.
  * El frontend actualiza la interfaz mostrando el nuevo stock en tiempo real.

### Paso 5: Requisito Crítico de PWA y Cámara (HTTPS)
* La API del navegador que accede a la cámara (`navigator.mediaDevices.getUserMedia`) está **bloqueada por seguridad en conexiones HTTP estándar**.
* **Solo funciona en dos escenarios**:
  1. En `http://localhost:3000` (desarrollo local en tu computadora).
  2. En dominios con **HTTPS y certificado SSL válido** (cuando Thiago despliegue la PWA en Vercel).
* *Nota para el laboratorio*: Si intentás abrir la app desde el celular usando la IP local de tu PC (`http://192.168.x.x:3000`), el navegador del celular te denegará el acceso a la cámara. Para probarla en el celular durante la clase, la app debe estar subida a Vercel o compartida mediante un túnel seguro HTTPS.

---

## 🎯 5. Criterio de Éxito (Cómo saber que el módulo está terminado)

Tu entrega estará aprobada cuando:
1. La pantalla de escaneo respete el diseño y logo oficial de **Kennedy TechSolutions** (sin referencias a "Alaska").
2. Al escanear un QR de prueba o escribir el SKU manual, la app consulte a Aiven y pinte los datos del repuesto en pantalla.
3. Se pueda ingresar o retirar unidades y el cambio impacte de inmediato en la base de datos MySQL en la nube.
4. Si el producto llega a un stock menor al `stock_minimo`, la interfaz muestre una advertencia visual de color rojo ("Stock Crítico").
