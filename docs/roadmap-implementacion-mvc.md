# 🧠 Guía de Razonamiento y Arquitectura: Cómo Pensar en MVC y APIs

**Proyecto:** Kennedy TechSolutions — E.E.S.T N° 5 (7º 5ta)  
**Materia:** Desarrollo de Software para Plataformas Móviles  
**Profesor:** Axel Castellano Gutiérrez  
**Repositorio:** `TechSolutions-J-F-Kennedy/TechSolutions`

---

## 🛑 Principio Rector: Entender Antes de Escribir

> **El código es la última consecuencia de haber entendido el problema.**  
> Si se sientan a teclear sin saber cómo viajan los datos entre el celular y la nube, terminan guardando archivos en carpetas locales que se borran solas, mezclando consultas SQL con eventos de botones o programando en carpetas de prueba que nadie puede usar.  
> Cada funcionalidad del sistema se razona de **atrás hacia adelante**: desde los datos hacia la pantalla.

---

## 🔄 El Método de Pensamiento en 4 Pasos

Cada vez que un subgrupo deba construir o destrabar una funcionalidad en TechSolutions, **está prohibido arrancar dibujando la pantalla**.  
Deben discutir y responderse las siguientes preguntas en este orden estricto:

```text
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 1. MODEL        │ ──►  │ 2. CONTROLLER   │ ──►  │ 3. ROUTER       │ ──►  │ 4. VISTA (DOM)  │
│ ¿Qué datos hay? │      │ ¿Qué reglas hay?│      │ ¿Cómo lo expongo?│     │ ¿Cómo lo muestro?
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

### 1️⃣ Paso 1: El Modelo (`backend/src/models/`) — *El Contrato con los Datos*
El Modelo es el único componente que conoce la base de datos MySQL en Aiven Cloud. No sabe qué es HTTP, no sabe qué es un botón ni qué es una respuesta JSON.

**Preguntas que el subgrupo debe responderse:**
* ¿A qué tabla de Aiven necesito consultar o modificar (`Usuarios`, `Servicios`, `Productos_stock`, `Solicitudes`)?
* ¿Qué operación SQL necesito: un `SELECT` (lectura), un `INSERT` (creación) o un `UPDATE` (modificación)?
* ¿Qué parámetros necesita recibir la función para no fallar (un `id`, un objeto de datos)?
* ¿La consulta usa sentencias preparadas con signos de pregunta (`?`) para evitar inyecciones SQL?

---

### 2️⃣ Paso 2: El Controlador (`backend/src/controllers/`) — *El Cerebro y las Reglas de Negocio*
El Controlador recibe la petición del cliente y decide qué hacer. No ejecuta SQL directo: le pide los datos al Modelo.

**Preguntas que el subgrupo debe responderse:**
* ¿Qué datos me está mandando el frontend (`req.params`, `req.body`, `req.file`)?
* ¿Qué validaciones de seguridad tengo que hacer antes de tocar la base de datos?
  * *¿El email tiene formato válido?*
  * *¿La disponibilidad es exclusivamente "disponible" o "no disponible"?*
  * *¿Hay stock suficiente en depósito antes de autorizar un egreso?*
* Si algo está mal: ¿Qué código de error HTTP corresponde devolver (`400 Bad Request`, `404 Not Found`) y qué mensaje le doy al usuario?
* Si todo está bien: ¿Llamo al Modelo y respondo con código `200 OK` o `201 Created` entregando el resultado en un objeto JSON (`{ payload: ... }`)?

---

### 3️⃣ Paso 3: El Enrutador (`backend/src/routes/`) — *La Ventanilla de la API*
El Router define cómo el mundo exterior (la web, la PWA del celular o una terminal) se comunica con nuestro servidor Node.js.

**Preguntas que el subgrupo debe responderse:**
* ¿Qué verbo HTTP representa la acción que quiero realizar?
  * `GET`: Solo para pedir y leer información (nunca modifica datos).
  * `POST`: Para crear un nuevo recurso (un login, una solicitud, un nuevo producto).
  * `PATCH` o `PUT`: Para modificar el estado de algo existente (cambiar disponibilidad, actualizar stock).
  * `DELETE`: Para dar de baja.
* ¿Cuál es la URL semántica y limpia? (Ejemplo: `/api/tecnicos/:id/servicios-pendientes`, `/api/stock/:codigo`).
* ¿A qué función del Controlador debe despachar esta ruta?

---

### 4️⃣ Paso 4: La Vista y el Script del Cliente (`frontend/` y `frontend/js/`) — *El Consumidor*
La Vista es la pantalla en el celular. No sabe qué contraseña tiene la base de datos ni qué tablas existen: solo sabe hacer un `fetch()` a la API y pintar el HTML con los datos recibidos.

**Preguntas que el subgrupo debe responderse:**
* ¿En qué momento debo disparar la consulta (al cargar la página con `DOMContentLoaded`, al enviar un formulario o al escanear un código)?
* Mientras la red tarda en responder: ¿Muestro un cartel o spinner de carga?
* Si la API devuelve un error: ¿Cómo se lo explico al usuario de forma clara sin romper la pantalla?
* Si la API devuelve los datos con éxito: ¿Qué elementos del DOM tengo que crear o actualizar?

---

## 🍽️ La Analogía Clave: El Restaurante

Para no perderse nunca en la arquitectura:

| Componente | Rol en el Restaurante | Rol en TechSolutions |
| :--- | :--- | :--- |
| **Frontend (HTML/JS)** | El cliente sentado en la mesa. | La pantalla del celular del técnico o cliente. |
| **Router (`routes/`)** | La carta con el menú de platos disponibles. | Las URLs que dicen qué se puede pedir (`/api/...`). |
| **Controller (`controllers/`)** | El Mozo que toma la comanda y valida las reglas. | Recibe el pedido, valida datos y devuelve el JSON. |
| **Model (`models/`)** | El Cocinero que sabe dónde están los ingredientes. | Ejecuta las consultas SQL contra MySQL. |
| **Base de Datos (Aiven)** | La heladera y la despensa de la cocina. | Almacenamiento centralizado y seguro de datos. |

> **Regla de oro:** El comensal en la mesa jamás entra a la cocina a meter la mano en la heladera (el frontend jamás habla directo con MySQL). Todo pedido pasa siempre por el Mozo (la API).

---

## 🗺️ Mapa de Situación y Plan de Acción por Subgrupo

---

### 🛠️ Subgrupo A1: Gestión de Técnicos (Perfil, Inicio y Tareas)
* **Líder:** Sofía Pignataro (`@Coffy`)
* **Integrantes:** Santiago Pérez, Brenda De Santis, Sol Marín.
* **Rama de Integración:** `a1-principal-pignataro` ➔ `develop`

#### ✅ Qué tienen logrado (¡Gran trabajo!)
* Son el subgrupo con la arquitectura MVC más madura: ya tienen endpoints funcionando en `tecnico.routes.js`, `tecnico.controllers.js` y `tecnico.models.js`.
* `frontend/js/tecnico.inicio.js` y `tecnico.tareas.js` ya consumen la API con `fetch()`.
* Santiago Pérez implementó la lógica de geolocalización de técnicos (`backend/src/utils/geo.js`).

#### ⚠️ Qué les falta y cómo organizarse
1. **Integración interna:** Sofía debe revisar y mergear la rama de Santiago Pérez (`a1-perez`) dentro de `a1-principal-pignataro`.
2. **Reactivar a Brenda De Santis y Sol Marín:**
   * Tienen 0 commits desde hace 5 semanas. Deben clonar el repositorio, configurar su `.env` local y tomar tareas concretas:
   * **Tarea Brenda:** Implementar en `frontend/js/tecnico.tareas.js` el cambio de estado de un pedido (de "pendiente" a "en camino" y "finalizado") conectándolo con un endpoint `PATCH /api/tecnicos/servicios/:id/estado`.
   * **Tarea Sol:** Validar y pulir la pantalla de edición de perfil (`frontend/perfil.html`), asegurando que los campos requeridos no viajen vacíos y mostrando mensajes de éxito claros.
3. **Archivos de trabajo:**
   * `backend/src/controllers/tecnico.controllers.js`
   * `backend/src/models/tecnico.models.js`
   * `frontend/js/tecnico.tareas.js` y `frontend/js/perfil.js`

---

### 📦 Subgrupo A2: Clientes y Solicitudes de Servicio (Fotos y Chat)
* **Líder:** Tobías Frete (`@fretetobias21`)
* **Integrantes:** Thiago Frete, Aaron Barrios, Santiago Pogonza.
* **Rama de Integración:** `a2-principal-frete-tobias` ➔ `develop`

#### ✅ Qué tienen logrado
* Thiago maquetó la interfaz del chat (`frontend/chat.html`).
* Aaron construyó el backend inicial de solicitudes (`solicitudes.routes.js`, `solicitudes.controller.js`).

#### ⚠️ Qué les falta y cómo organizarse
1. **Desbloqueo de Imágenes (Aaron Barrios):**
   * El código actual guarda imágenes en `backend/uploads/` en el disco local de Aaron. Esto va a crashear en Vercel.
   * Aaron debe seguir la guía arquitectónica en [`docs/guia-almacenamiento-imagenes-cloud.md`](file:///home/axel/Escritorio/Clases/moviles-2026-docente/alumnos/Grupo%20A%20-%20Viernes/TechSolutions/docs/guia-almacenamiento-imagenes-cloud.md) para migrar a **Cloudinary + Multer memoryStorage**, guardando en Aiven solo la URL pública HTTPS.
2. **Reactivar a Santiago Pogonza:**
   * Lleva 5 semanas inactivo. Su tarea asignada es conectar el formulario del cliente (`frontend/solicitud.html` y `frontend/js/solicitud.js`) mediante un `fetch(..., { method: 'POST', body: formData })` contra la API que está terminando Aaron.
3. **Backend del Chat (Thiago y Tobías):**
   * El chat visual necesita persistencia. Deben crear `chat.routes.js`, `chat.controllers.js` y `chat.models.js` para registrar mensajes por número de servicio (`id_servicio`, `emisor`, `mensaje`, `fecha`).
4. **Archivos de trabajo:**
   * `backend/src/routes/solicitudes.routes.js`
   * `backend/src/controllers/solicitudes.controller.js`
   * `frontend/js/solicitud.js`
   * `frontend/js/chat.js` *(A crear)*

---

### 🔍 Subgrupo A3: Depósito, Inventario y Lector QR
* **Líder:** Santino Enriquez (`@enriquezsantinonicolas-beep`)
* **Integrantes:** Lucas Barrionuevo, Gabriel Duarte, Juan Esteban Jiménez.
* **Rama de Integración:** `a3-principal-enriquez` ➔ `develop`

#### ✅ Qué tienen logrado
* Santino creó el backend inicial de inventario (`stock.routes.js`, `stock.controllers.js`, `stock.models.js`) consultando la tabla `Productos_stock` en Aiven.
* Lucas hizo andar la cámara con `html5-qrcode`.

#### ⚠️ Qué les falta y cómo organizarse
1. **Conexión interna entre Lucas y Santino:**
   * Lucas estaba trabajando en una carpeta aislada llamada "Alaska". Debe seguir la guía en [`docs/guia-implementacion-lector-qr.md`](file:///home/axel/Escritorio/Clases/moviles-2026-docente/alumnos/Grupo%20A%20-%20Viernes/TechSolutions/docs/guia-implementacion-lector-qr.md) para mudar el lector a `frontend/herramientas.html` y purgar la carpeta "Alaska".
   * El escáner de Lucas debe consumir el backend de Santino haciendo un `fetch('/api/stock/' + codigoLeido)`.
2. **Reactivar a Gabriel Duarte y Juan Esteban Jiménez:**
   * Tienen 0 commits hace 5 semanas. Deben tomar tareas concretas del módulo de stock:
   * **Tarea Gabriel:** Implementar el endpoint y controlador de movimiento de stock: `POST /api/stock/:id/movimiento` (sumar o restar unidades en Aiven validando que no quede stock negativo).
   * **Tarea Juan Esteban:** Crear la interfaz del modal o tarjeta de resultado en el frontend que muestra los datos del producto escaneado y los botones de `[ + Ingreso ]` y `[ - Retiro ]`.
3. **Archivos de trabajo:**
   * `frontend/herramientas.html` e `inventario.html`
   * `frontend/js/stock.js` y `frontend/js/qr-scanner.js`
   * `backend/src/controllers/stock.controllers.js`
   * `backend/src/models/stock.models.js`

---

## 🚦 Protocolo de Trabajo en Git y Pull Requests

Para que el proyecto no vuelva a sufrir problemas de ramas desordenadas:

1. **Ramas Personales:** Cada integrante trabaja exclusivamente en su rama (`a1-perez`, `a2-barrios`, `a3-barrionuevo`, etc.).
2. **Revisión del Líder de Subgrupo:**
   * El alumno abre un Pull Request hacia la rama principal de su subgrupo (`a1-principal-pignataro`, `a2-principal-frete-tobias` o `a3-principal-enriquez`).
   * El líder revisa el código en GitHub ("Files Changed"), comenta si hay errores y aprueba el PR.
3. **Pase a `develop`:**
   * Solo los líderes de subgrupo abren Pull Requests desde su rama principal hacia `develop`.
   * Thiago Frete (Líder General) o el docente revisan y aprueban el pase a `develop`.
4. **Prohibido subir `node_modules` o archivos de prueba sueltos:**
   * Revisar siempre con `git status` antes de hacer `git add`.
   * Los archivos `.env` con credenciales de base de datos **NUNCA** se suben a GitHub.
