# 🎬 Hilo Conductor Integrado: La Historia de un Servicio Técnico

El proyecto **Kennedy Tech Solutions** no consta de aplicaciones aisladas, sino de una **única plataforma viva** donde las acciones de un usuario impactan inmediatamente en los demás.

A continuación se detalla la historia paso a paso (6 Escenas) que demuestra la integración entre los módulos de Cliente (A2), Técnico (A1) y Depósito (A3).

---

## 🎭 Escena 1: El Cliente solicita auxilio técnico (Subgrupo A2 - PWA Cliente)

1. **Lucas** (cliente) sufre una falla grave en la red Wi-Fi de su estudio contable.
2. Abre la PWA **Kennedy Tech Solutions** desde la pantalla de inicio de su teléfono celular.
3. Elige la categoría **"Redes e Infraestructura"**, describe el problema ("Sin conexión a internet en 5 puestos") e ingresa la dirección del estudio.
4. El sistema crea la solicitud en estado **`Solicitado`**.

---

## 🎭 Escena 2: Asignación y Notificación al Técnico (Subgrupo A1 - PWA Técnico)

1. **Marcos** (técnico de servicio) está en su horario laboral y abre la PWA de Técnicos en su celular.
2. En su listado de **Ruta Diaria**, recibe una alerta en tiempo real con el nuevo servicio en su zona.
3. Acepta la orden. La solicitud en el sistema cambia al estado **`Asignado`**.
4. La PWA muestra la ruta óptima de llegada hasta la dirección del estudio contable de Lucas.

---

## 🎭 Escena 3: Arribo y Check-In por GPS (Subgrupo A1 - PWA Técnico)

1. Marcos llega a la puerta del estudio contable.
2. Abre la orden de trabajo en su PWA y presiona el botón **"Check-In de Arribo"**.
3. La aplicación valida mediante el **GPS del celular** que el técnico se encuentra a menos de 50 metros del domicilio.
4. Al confirmarse la ubicación, el estado del servicio pasa automáticamente a **`En Camino / En Sitio`**. Lucas recibe una notificación instantánea en su PWA Cliente.

---

## 🎭 Escena 4: Reparación y Escaneo de Insumos (Subgrupo A1 & Subgrupo A3)

1. Marcos evalúa la falla y detecta que requiere reemplazar un **Switch de 8 puertos** y **15 metros de cable UTP**.
2. Toma los insumos del vehículo de servicio (que fueron previamente retirados del depósito).
3. Marcos abre el módulo de insumos de su PWA y utiliza la **cámara del celular** para escanear el código QR del Switch.
4. El sistema valida el QR consumido, descuenta la unidad del inventario general del sistema (vía base de datos central gestionada por el Subgrupo A3) y asocia el material a la ficha de trabajo del servicio.

---

## 🎭 Escena 5: Finalización y Check-Out (Subgrupo A1 & Subgrupo A2)

1. Terminada la instalación de la red, Marcos realiza las pruebas de conectividad y le pide a Lucas la conformidad.
2. Marcos presiona **"Finalizar Servicio & Check-Out"** en su PWA.
3. El sistema actualiza el estado de la orden a **`Finalizado`** y genera un comprobante digital estimado con el detalle del servicio y materiales consumidos.

---

## 🎭 Escena 6: Calificación y Reseña del Cliente (Subgrupo A2 - PWA Cliente)

1. Lucas abre su PWA Cliente y ve su servicio finalizado.
2. Presiona en el botón **"Calificar Servicio"**, selecciona **5 estrellas** y escribe un comentario: *"Excelente atención de Marcos, resolvió la falla de red muy rápido y todo quedó impecable"*.
3. La reseña se guarda en la base de datos y actualiza el promedio de reputación del técnico Marcos visible en la plataforma.
