# 🚀 Guía de Despliegue en Vercel (PWA HTTPS)

**Responsable Principal**: Thiago Frete (`@itsthaigr`) — Líder General y Dueño del Repositorio

---

## 🎯 ¿Por qué Vercel para una PWA?

Las Progressive Web Apps (PWA) exigen por estándar mundial de seguridad **funcionar bajo el protocolo cifrado HTTPS**. Sin HTTPS, las funciones avanzadas como la **instalación en pantalla de inicio**, la **cámara de escaneo QR** y la **geolocalización por GPS** quedan bloqueadas por el navegador del celular.

Vercel provee dominios HTTPS con certificado SSL automático y gratuito, integrado de manera nativa con GitHub.

---

## 📋 Pasos para el Despliegue (Thiago Frete)

### 1. Crear Cuenta en Vercel
1. Ingresar a [Vercel.com](https://vercel.com/).
2. Seleccionar **"Sign Up"** y elegir iniciar sesión directamente con la cuenta de **GitHub** (`@itsthaigr`).

### 2. Importar el Repositorio `TechSolutions`
1. En el panel de control (Dashboard) de Vercel, hacer clic en el botón **"Add New..."** -> **"Project"**.
2. Buscar y seleccionar el repositorio `TechSolutions-J-F-Kennedy/TechSolutions`.
3. Si es la primera vez, autorizar a Vercel a acceder a la organización de GitHub.

### 3. Configuración del Proyecto
1. **Framework Preset**: Dejar en `Other` o `Vite` (según se use HTML/JS vanila o Vite).
2. **Root Directory**: `./`.
3. Presionar **"Deploy"**.

### 4. Configurar Despliegue Automático por Ramas
- Vercel detectará los cambios en la rama `main` y publicará la versión oficial de producción.
- Además, creará **Preview Deployments** automáticos para cada Pull Request que abran los integrantes en las ramas `a1`, `a2` y `a3`, permitiendo probar las funciones en celulares antes de fusionar el código.
