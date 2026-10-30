# 🔧 Guía de Inicio: Subgrupo A1 (Módulo Técnico - PWA Celular)

**Integrantes**: *A definir por el equipo*  
**Rama de trabajo**: `a1`

---

## 🎯 Objetivo del Módulo

El Módulo A1 provee la interfaz PWA para los técnicos de servicio en campo. Su función principal es guiar la jornada de trabajo del técnico, organizar sus visitas agendadas, permitir la validación geográfica mediante el GPS del celular y registrar los insumos utilizados en cada servicio.

---

## 📱 Pantallas y Flujos de Usuario

### 1. Pantalla de Inicio / Agenda del Día
- **Muestra**: Saludo personalizado al técnico, estado actual (Disponible / En Trabajo / Fuera de Servicio) y lista de órdenes asignadas para el día.
- **Acción**: El técnico toca una orden para desplegar la ficha de trabajo con los datos del cliente, la falla reportada y la dirección.

### 2. Ficha de Trabajo y Navegación
- **Muestra**: Dirección del cliente, horario acordado, botón "Ver Ruta de LLegada" y descripción detallada del problema expresado por el cliente.
- **Acción**: Al dirigirse al domicilio, el técnico presiona el botón para abrir la ruta en el mapa.

### 3. Pantalla de Arribo y Check-In por GPS
- **Muestra**: Indicador de precisión GPS del celular y distancia actual a la casa o comercio del cliente.
- **Acción**: Cuando la PWA detecta que el técnico está a menos de 50 metros del objetivo, se habilita el botón **"Check-In de Arribo"**. Al presionarlo, la orden pasa al estado `En Sitio` y se notifica al cliente.

### 4. Registro de Materiales e Insumos Utilizados
- **Muestra**: Lista de repuestos y materiales seleccionados para la orden (ej: cables, switches, conectores).
- **Acción**: Botón "Agregar Material", que permite escanear el código QR del producto con la cámara o buscarlo manualmente para incluirlo en la liquidación final del servicio.

### 5. Finalización de Servicio y Check-Out
- **Muestra**: Resumen final del servicio realizado, costo de materiales y tiempo dedicado.
- **Acción**: El técnico presiona **"Finalizar Servicio & Check-Out"**. La solicitud cambia al estado `Finalizado` y el cliente queda habilitado para dejar su reseña.

---

## 🔒 Requisitos Técnicos y de Almacenamiento Local

- **Geolocalización del Navegador**: El navegador del celular solicita permiso para acceder a la posición en vivo (`navigator.geolocation`).
- **Sincronización Offline**: Si la conexión de datos móviles se interrumpe durante el servicio, los datos del Check-In o insumos se guardan localmente en `localStorage` o `IndexedDB` y se envían automáticamente al recuperar la señal.
