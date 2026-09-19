# 📱 Guía de Inicio: Subgrupo A2 (Módulo Cliente - PWA Marketplace Celular)

**Integrantes**: Axel Barrionuevo, Tobías Frete, Lautaro Pogonza, Mateo Marín.  
**Rama de trabajo**: `a2`

---

## 🎯 Objetivo del Módulo

El Módulo A2 ofrece la experiencia PWA para los clientes que necesitan solicitar asistencia técnica a demanda desde sus teléfonos móviles. Permite crear solicitudes de servicio, realizar el seguimiento transparente en 5 estados, calificar la atención recibida y acceder al comprobante digital.

---

## 📱 Pantallas y Flujos de Usuario

### 1. Pantalla Principal / Catálogo de Servicios
- **Muestra**: Buscador de servicios, categorías (Computación, Redes, Servidores, Cámaras de Seguridad) y ofertas del día.
- **Acción**: El cliente navega por las opciones y presiona "Solicitar Técnico".

### 2. Formulario de Solicitud de Servicio a Demanda
- **Muestra**: Campos sencillos para la dirección del trabajo, descripción breve del fallo y opción de adjuntar una foto ilustrativa del problema.
- **Acción**: Al presionar **"Confirmar Solicitud"**, el sistema genera la orden en estado `Solicitado` y la pone a disponibilidad de la red de técnicos.

### 3. Seguimiento en Tiempo Real (Timeline de 5 Estados)
- **Muestra**: Una barra de progreso con los 5 estados del servicio:
  1. `Solicitado` (Esperando asignación de técnico).
  2. `Asignado` (Técnico asignado y en preparación).
  3. `En Camino / En Sitio` (Técnico transitando hacia el domicilio o en la puerta).
  4. `Finalizado` (Trabajo concluido y validado).
  5. `Cancelado` (En caso de anulación del pedido).

### 4. comprobante Digital Estimado
- **Muestra**: Detalle de mano de obra, materiales empleados (extraídos automáticamente del registro del técnico) y el monto total a abonar.
- **Acción**: Botón "Descargar / Guardar Comprobante".

### 5. Calificación y Reseñas (1 a 5 Estrellas)
- **Muestra**: Una vez que el servicio pasa al estado `Finalizado`, se despliega un diálogo emergente interactivo.
- **Acción**: El cliente selecciona una puntuación de **1 a 5 estrellas**, redacta un comentario sobre la atención recibida y confirma la valoración. Esta puntuación actualiza la reputación pública del técnico.

---

## 💡 Instalación PWA y Experiencia App

- La aplicación muestra un banner discreto en la parte inferior del celular animando al usuario a **"Agregar Kennedy Tech a la Pantalla de Inicio"**.
- Al agregarse, funciona de manera autónoma con su propio ícono, pantalla de carga (Splash Screen) y pantalla completa sin barras del navegador.
