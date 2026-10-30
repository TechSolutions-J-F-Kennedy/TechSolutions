# 💻 Alcance Web Desktop vs. Móvil (PWA Celular)

Para el desarrollo del proyecto **Kennedy Tech Solutions**, se establece una separación clara entre el uso en las computadoras del colegio y el uso en teléfonos celulares.

---

## 🖥️ Módulo Web Desktop (Computadoras del Laboratorio)

Las pantallas diseñadas para ser ejecutadas en computadoras (escritorio / navegador tradicional) están orientadas al trabajo de **Administración y Gestión Centralizada**:

1. **Panel de Gestión de Servicios**:
   - Visualización global de todas las solicitudes recibidas en tiempo real.
   - Reasignación manual de técnicos ante imprevistos.
   - Historial completo de intervenciones finalizadas.

2. **Panel de Inventario y Depósito General**:
   - Carga masiva de catálogo de materiales, repuestos y herramientas.
   - Impresión de etiquetas con códigos QR para el stock.
   - Alertas visuales de insumos con stock crítico (por debajo del límite mínimo).

3. **Panel de Usuarios y Calificaciones**:
   - Alta, baja y modificación de técnicos y clientes.
   - Monitoreo del nivel de reputación y reseñas promedio otorgadas por los clientes.

---

## 📱 Módulo Móvil PWA (Teléfonos Celulares)

Las aplicaciones instaladas como **PWA en celulares** se enfocan en la experiencia operativa en movimiento y en la agilidad del usuario final:

1. **Módulo Cliente (A2)**:
   - Instalación como PWA directamente desde el navegador (sin tiendas de apps).
   - Solicitud ágil de servicios técnicos en 3 pasos.
   - Seguimiento visual del estado del servicio en tiempo real (5 estados).
   - Calificación por estrellas (1 a 5) y reseña del técnico asignado.

2. **Módulo Técnico (A1)**:
   - Agenda de visitas diarias con mapa y orden prioritario.
   - **GPS Check-In / Check-Out**: Validación de arribo a la ubicación del cliente mediante la ubicación del teléfono.
   - Registro de materiales utilizados durante la atención.

3. **Módulo Depósito / Cámara QR (A3)**:
   - **Escáner de Código QR vía cámara del celular**: Lectura directa de repuestos y materiales utilizando la WebRTC/Camera API.
   - Formulario rápido de **fallback manual por código SKU** en caso de mala iluminación o falla física del QR.
   - Ajuste rápido de entrada y salida de stock desde el celular en el depósito.
