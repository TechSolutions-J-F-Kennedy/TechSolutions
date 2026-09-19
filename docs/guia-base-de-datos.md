# 🗄️ Guía de Base de Datos y Servicios Cloud

**Responsable Principal**: Aaron Barrios (`@Faceleskhan22`) — Líder de BD & Backend  
**Líder General**: Thiago Frete (`@itsthaigr`)

---

## 🎯 Objetivo de la Guía

Esta guía detalla los pasos para crear, administrar y conectar la base de datos MySQL en la nube utilizando el servicio gratuito **Aiven Cloud**, así como la extensión **Database Client** en VS Code para las computadoras del colegio.

---

## ☁️ Paso 1: Creación de la Base de Datos en Aiven Cloud

1. Iniciar sesión o registrarse en [Aiven.io](https://aiven.io/).
2. Crear un nuevo servicio de tipo **MySQL**.
3. Seleccionar el plan gratuito (**Free Tier**).
4. Guardar los siguientes credenciales generados por Aiven:
   - **Host / Hostname** (ej: `mysql-xxxx-xxxx.aivencloud.com`)
   - **Puerto** (ej: `12345` o `3306`)
   - **Usuario** (`avnadmin`)
   - **Contraseña** (generada por la plataforma)
   - **Nombre de la Base de Datos** (`defaultdb` o `techsolutions_db`)

---

## 💻 Paso 2: Instalación de la Extensión en VS Code (Laboratorio)

En las computadoras del colegio (sin MySQL local), utilizaremos la extensión oficial de administración de base de datos dentro de VS Code:

1. Abrir VS Code en la PC del colegio.
2. Ir al panel de **Extensiones** (`Ctrl + Shift + X`).
3. Buscar e instalar la extensión **Database Client** (o **MySQL Client** de cweijan).
4. En la barra lateral izquierda, hacer clic en el ícono del enchufe / base de datos.
5. Seleccionar **"Create Connection"** -> **MySQL**.
6. Completar los campos con la información de Aiven Cloud:
   - **Host**: Pegar el Hostname de Aiven.
   - **Port**: Pegar el puerto de Aiven.
   - **User**: `avnadmin`.
   - **Password**: Pegar la contraseña de Aiven.
   - **Database**: `techsolutions_db`.
   - **SSL**: Activar/requerido (Aiven exige conexión SSL cifrada).
7. Presionar **"Test Connection"** y luego **"Save"**.

---

## 📊 Paso 3: Estructura Principal de Tablas Recomendada

1. **`usuarios`**: Contiene clientes, técnicos y administradores (ID, nombre, email, rol, reputación_promedio).
2. **`servicios`**: Registro de órdenes de trabajo (ID, cliente_id, tecnico_id, estado, descripcion, direccion, ubicacion_lat_long, fecha_creacion).
3. **`productos_stock`**: Catálogo de insumos (ID, codigo_sku, codigo_qr, nombre, descripcion, stock_actual, stock_minimo).
4. **`insumos_servicio`**: Relación entre productos consumidos y la orden de trabajo (ID, servicio_id, producto_id, cantidad).
5. **`reseñas`**: Puntuación otorgada por el cliente (ID, servicio_id, cliente_id, tecnico_id, estrellas, comentario, fecha).
