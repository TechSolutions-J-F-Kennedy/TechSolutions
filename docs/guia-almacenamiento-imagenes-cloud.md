# 📸 Guía Arquitectónica: Almacenamiento de Imágenes en la Nube (Cloudinary + Aiven)

**Destinatario**: Aaron Barrios (`@Faceleskhan22`) — Responsable de Base de Datos y Backend (Subgrupo A2)  
**Contexto**: Módulo de Solicitudes de Servicio (`backend/src/routes/solicitudes.routes.js`, `solicitudes.controller.js`, `solicitudes.model.js`)  
**Proyecto**: Kennedy TechSolutions — 7º 5ta (E.E.S.T. Nº 5)

---

## 🧭 1. El Problema Técnico: ¿Por qué NO podemos guardar imágenes en Aiven ni en el disco local?

Durante el desarrollo inicial del módulo de solicitudes, se implementó la subida de fotos guardando los archivos en una carpeta física local (`backend/uploads/`) mediante `multer.diskStorage`, y guardando el nombre del archivo en la base de datos. 

Este enfoque presenta **dos limitaciones arquitectónicas críticas**:

### A. El mito de "Guardar la foto en Aiven"
* **Aiven provee MySQL**, que es un motor de **base de datos relacional**. Está diseñado para procesar registros estructurados (números, fechas, textos, relaciones entre claves foráneas).
* Guardar archivos binarios pesados (imágenes en formato `BLOB` o texto codificado en `Base64`) dentro de una tabla SQL es un **anti-patrón de diseño**:
  1. Satuta el buffer de memoria del motor de base de datos.
  2. Degrada el rendimiento de las consultas `SELECT`.
  3. Hace explotar el límite de almacenamiento del plan gratuito de Aiven.
* **Regla de oro de la industria**: *En la base de datos relacional SOLO se guarda texto (la URL pública de la imagen). Los archivos binarios pesados viven en un almacenamiento de objetos especializado (Object Storage / CDN).*

### B. El problema de `backend/uploads/` y Vercel
* El proyecto está planificado para desplegarse en **Vercel** (según la guía de Thiago Frete).
* Vercel opera bajo una arquitectura **Serverless**: el sistema de archivos del servidor es de **solo lectura y efímero**. Cualquier archivo que intentes guardar en una carpeta física como `backend/uploads/` arrojará un error de permisos o se borrará en milisegundos cuando la función termine de ejecutarse.
* Además, si guardás archivos en tu disco local, tus compañeros o los usuarios que entren desde sus teléfonos nunca podrán ver esas fotos porque residen únicamente en tu computadora.

---

## 🏗️ 2. La Solución Arquitectónica: Separación de Responsabilidades

Para resolver esto como ingenieros de software profesionales, dividimos la responsabilidad en 3 actores:

```
[ Frontend: Teléfono / Web ]
           │
           │ 1. POST multipart/form-data (FormData)
           ▼
[ Backend: Express en Node.js ]
           │
           ├─► 2. Multer en Memoria (RAM temporal: req.file.buffer)
           │
           ├─► 3. Sube el buffer a Cloudinary (CDN de imágenes)
           │      Devuelve: "https://res.cloudinary.com/.../foto.webp"
           │
           ▼
[ Base de Datos: MySQL en Aiven ]
           │
           └─► 4. INSERT INTO Solicitudes (..., foto)
                  Guarda ÚNICAMENTE el string de la URL HTTPS
```

1. **Cloudinary (Storage + CDN)**: Recibe el archivo de imagen, lo procesa, lo aloja de forma permanente y genera una URL pública segura con HTTPS (fundamental para la PWA).
2. **Aiven (MySQL)**: En la columna `foto` de la tabla `Solicitudes`, almacena un simple `VARCHAR(255)` con la URL devuelta por Cloudinary.
3. **Node.js / Express**: Solo actúa como puente de validación y despacho; **no almacena ningún archivo en disco**.

---

## 📁 3. Mapa de Archivos a Modificar

Para implementar esta arquitectura, estos son los archivos exactos donde tenés que intervenir:

| Archivo | Responsabilidad / Cambio a Realizar |
| :--- | :--- |
| `backend/package.json` | Instalar la librería oficial `cloudinary` para Node.js (manteniendo `multer`). |
| `backend/.env` y `.env.example` | Agregar las 3 variables de entorno de Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). |
| `backend/src/config/cloudinary.js` *(Nuevo)* | Archivo de configuración centralizado donde se inicializa el SDK de Cloudinary con las credenciales de entorno. |
| `backend/src/routes/solicitudes.routes.js` | Modificar la configuración de Multer: reemplazar `diskStorage` por `memoryStorage`. Eliminar el uso de `fs` y carpetas locales. |
| `backend/src/controllers/solicitudes.controller.js` | En lugar de tomar `req.file.filename`, conectar el buffer de la imagen con la subida a Cloudinary, capturar la URL segura generada (`secure_url`) y enviársela al modelo. |
| `backend/src/models/solicitudes.model.js` | Asegurar que la consulta `INSERT` guarde la URL completa recibida del controlador en la columna `foto`. |
| `.gitignore` | Asegurar que la carpeta `backend/uploads/` y los archivos de credenciales nunca se suban al repositorio. |

---

## 🧠 4. Guía Conceptual de Implementación (Paso a Paso)

### Paso 1: Configurar la cuenta gratuita de Cloudinary
1. Ingresá a [Cloudinary.com](https://cloudinary.com/) y registrate con tu cuenta de correo.
2. En el panel principal (**Dashboard**), vas a encontrar tres datos clave:
   * **Cloud Name**
   * **API Key**
   * **API Secret**
3. **Pregunta de diseño**: ¿Dónde deben vivir estos tres valores? Nunca en el código fuente. Agregalos en tu archivo local `.env` y documentá sus nombres vacíos en `backend/.env.example`.

### Paso 2: Centralizar la configuración del SDK
* En lugar de llamar a `cloudinary.config()` en cualquier lado, creá un módulo limpio en `backend/src/config/cloudinary.js`.
* Su única tarea es importar la versión v2 de Cloudinary, configurar las credenciales leyendo `process.env`, y exportar la instancia lista para ser usada.

### Paso 3: De Almacenamiento en Disco a Almacenamiento en Memoria
* **¿Qué hace `multer.diskStorage`?**: Obliga a Node.js a escribir el archivo en el disco duro del servidor (`fs.mkdirSync`, `cb(null, carpeta)`). Esto falla en Vercel y es innecesario.
* **¿Qué hace `multer.memoryStorage`?**: Deja el archivo subido en la memoria RAM de Node.js como un búfer (`req.file.buffer`). 
* Al pasar a `memoryStorage`:
  1. Ya no necesitás rutas de carpetas relativas (`path.join(__dirname, ...)`).
  2. Ya no necesitás crear directorios físicos con `fs`.
  3. Mantenés el `fileFilter` que ya hiciste para validar extensiones y el `limits: { fileSize }` para que nadie te suba un archivo de 50MB a la memoria.

### Paso 4: La subida hacia Cloudinary en el Flujo de la Solicitud
Cuando el usuario envía el formulario con una foto:
1. Multer procesa la petición y pone la foto en `req.file.buffer`.
2. Tu controlador debe preguntarse:
   * *¿El usuario adjuntó una foto (`req.file`)?*
   * Si **no adjuntó foto**: la variable `fotoUrl` queda en `null`.
   * Si **sí adjuntó foto**: se utiliza la utilidad de carga de Cloudinary (por ejemplo a través de un stream de subida `uploader.upload_stream` o convirtiendo el buffer) para enviar esos bytes al servicio en la nube.
3. Al finalizar la subida, Cloudinary responde con un objeto que contiene la propiedad `secure_url`.
4. Esa `secure_url` (que tiene el formato `https://res.cloudinary.com/...`) es el dato final que le pasás a tu función `solicitudesModel.crearSolicitud()`.

### Paso 5: Verificación en la Base de Datos (Aiven)
* Abrí tu cliente de base de datos en VS Code y verificá la estructura de la tabla `Solicitudes`.
* La columna `foto` debe ser de tipo `VARCHAR(255)` o `TEXT`. Como ahora vas a guardar URLs completas (y no nombres cortos como `123.jpg`), asegurate de que la longitud del campo soporte la URL de Cloudinary sin truncar el texto.

### Paso 6: Limpieza del Repositorio
* En commits anteriores se subieron fotos de prueba dentro de `backend/uploads/`.
* Recordá borrar esos archivos de prueba y agregá `backend/uploads/` al `.gitignore` para no ensuciar el historial de git con binarios innecesarios.

---

## 🎯 5. Criterio de Éxito (Cómo saber que terminaste)

Podrás considerar completada la tarea cuando:
1. Al crear una solicitud desde `solicitud.html` adjuntando una foto, el registro se inserte exitosamente en MySQL en Aiven.
2. Al consultar la tabla `Solicitudes` en Aiven, la columna `foto` contenga un enlace que empiece con `https://res.cloudinary.com/...`.
3. Al abrir ese enlace en una pestaña nueva del navegador, la imagen se visualice con su certificado SSL válido.
4. No exista ningún archivo nuevo creado en el disco local dentro de `backend/uploads/`.
