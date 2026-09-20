# Kennedy Tech Solutions - PWA Servicios Técnicos a Demanda (2026)

Bienvenido al repositorio central del proyecto **Kennedy Tech Solutions** (E.E.S.T. N°5 - 7° Año, 2026).

Este proyecto es una plataforma distribuida de servicios técnicos a domicilio (reparación de computadoras, instalación de redes, servicio técnico en el sitio) estructurada en 3 Módulos PWA y un Panel de Administración Web.

---

## 👥 Organización del Equipo y Liderazgo

| Rol / Módulo | Integrantes | Rama Base |
| :--- | :--- | :--- |
| **Líder General / Dueño Repo** | Thiago Frete (`@itsthaigr`) | `main` / `develop` |
| **Líder Base de Datos & Cloud** | Aaron Barrios (`@Faceleskhan22`) | `develop` |
| **Subgrupo A1: Módulo Técnico (PWA)** | *A definir por el equipo* | `a1` |
| **Subgrupo A2: Módulo Cliente (PWA)** | *A definir por el equipo* | `a2` |
| **Subgrupo A3: Módulo Depósito / Stock (PWA)** | *A definir por el equipo* | `a3` |

---

## 📚 Documentación Integrada (`docs/`)

Para conocer los flujos de trabajo, arquitectura e instrucciones de desarrollo, consulta las siguientes guías:

1. 🎬 [**Hilo Conductor Integrado**](docs/hilo-conductor-integrado.md) — La historia completa de extremo a extremo que conecta al Cliente, Técnico y Depósito.
2. 💻 [**Alcance Web vs. Móvil (PWA)**](docs/alcance-web-vs-movil.md) — Definición de pantallas para computadoras del laboratorio vs. celulares.
3. 🔧 [**Guía de Inicio: Subgrupo A1 (Técnicos)**](docs/guia-inicio-subgrupo-a1.md) — Experiencia PWA para el técnico en la calle (GPS Check-In, ruta diaria).
4. 📱 [**Guía de Inicio: Subgrupo A2 (Clientes)**](docs/guia-inicio-subgrupo-a2.md) — Experiencia PWA para solicitar servicio a demanda, seguimiento en 5 estados y reseñas.
5. 📦 [**Guía de Inicio: Subgrupo A3 (Depósito)**](docs/guia-inicio-subgrupo-a3.md) — Experiencia PWA para control de stock con escáner de cámara QR y fallback manual.
6. 🗄️ [**Guía de Base de Datos (Aaron Barrios)**](docs/guia-base-de-datos.md) — Configuración de Aiven MySQL Cloud y VS Code Database Client.
7. 🚀 [**Guía de Despliegue Vercel (Thiago Frete)**](docs/guia-despliegue-vercel-thiago.md) — Guía paso a paso para publicar la PWA en HTTPS.
8. 🔀 [**Guía de Git y Flujo de Trabajo**](docs/guia-git-flujo-trabajo.md) — Reglas de ramas, Pull Requests y revisiones de código.
9. 📷 [**Imagen de Organización de Grupos**](docs/recursos/grupos-kennedy.jpg) — Ficha original de distribución del curso.
10. 🎨 [**Guía de Estilos Interactiva (HTML)**](docs/kennedy-tech-solutions-guia-estilos.html) — Sistema de diseño visual, componentes UI, paleta de colores, tipografías, botones, formularios, tarjetas y maquetas interactiva para Desktop y PWA Móvil.

---

## 🛠️ Tecnologías y Requisitos

- **Frontend**: HTML5, CSS3, JavaScript ES6+ (PWA, Service Workers, Web App Manifest).
- **Cámara & Sensores API**: HTML5 Camera Stream / WebRTC API (Módulo Depósito) y Geolocation API (Módulo Técnico).
- **Base de Datos & Backend**: MySQL / MariaDB (Aiven Cloud).
- **Hosting / Deploy**: Vercel (Frontend PWA con SSL/HTTPS obligatorio para PWA).