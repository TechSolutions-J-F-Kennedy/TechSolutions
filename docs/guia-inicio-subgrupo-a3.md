# 📦 Guía de Inicio: Subgrupo A3 (Módulo Depósito / Stock - PWA Cámara QR)

**Integrantes**: *A definir por el equipo*  
**Rama de trabajo**: `a3`

---

## 🎯 Objetivo del Módulo

El Módulo A3 administra el control de inventario de repuestos, herramientas e insumos técnicos. Su característica distintiva es el uso de la **cámara del teléfono celular como lector de código QR y de barras**, permitiendo egresos y movimientos de stock veloces directamente en las estanterías del depósito o en los vehículos de servicio.

---

## 📱 Pantallas y Flujos de Usuario

### 1. Panel de Control de Inventario
- **Muestra**: Listado de insumos registrados (cables, routers, conectores, placas de red), cantidad disponible y estado de stock (Normal, Bajo, Agotado).
- **Acción**: Buscador dinámico por nombre o categoría.

### 2. Escáner de Código QR por Cámara Móvil
- **Muestra**: Visor de video centrado en vivo que accede a la cámara trasera del teléfono.
- **Acción**: Al apuntar la cámara a la etiqueta QR pegada en la caja del producto, la PWA lee el código al instante, identifica el ítem y abre la ventana emergente de movimiento de stock (Ingreso / Egreso).

### 3. Formulario de Fallback Manual por SKU
- **Muestra**: Campo de texto amplio para ingresar o buscar el código SKU numérico o alfanumérico del repuesto.
- **Acción**: En situaciones de oscuridad en el depósito, código QR dañado o cámaras sin soporte técnico, el encargado usa esta pantalla de respaldo para ingresar el producto manualmente sin interrumpir la operación.

### 4. Ajustes y Movimientos de Stock
- **Muestra**: Cantidad a agregar o descontar, motivo del movimiento (Retiro para Visita Técnica, Devolución, Ingreso de Proveedor).
- **Acción**: Confirmar movimiento. La base de datos central descuenta o incrementa las unidades disponibles de forma inmediata.

---

## 📸 Integración Técnica de la Cámara

- **WebRTC / MediaDevices API**: Acceso seguro al sensor óptico trasero del celular mediante el estándar web nativo (`getUserMedia`).
- **Seguridad HTTPS**: El acceso a la cámara exige un entorno seguro con certificado SSL, por lo que el despliegue en Vercel es un requisito fundamental para probar esta función.
