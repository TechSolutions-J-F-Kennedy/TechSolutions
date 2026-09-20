# 📖 Guía Oficial de Flujo de Trabajo Git y Gobernanza — Grupo A

> **Proyecto:** Kennedy Tech Solutions — PWA Servicios Técnicos a Demanda (E.E.S.T. N° 5 - 2026)  
> **Organización:** [TechSolutions-J-F-Kennedy](https://github.com/TechSolutions-J-F-Kennedy)  
> **Propósito:** Definir los pasos exactos para desarrollar, enviar Pull Requests y revisar código según cada rol.

---

## 🗺️ Mapa Visual de la Arquitectura de Ramas

```text
main  (Producción / Entregable Estable)
 └── develop  (Integración Continua del Aula)
      │
      ├── a1  (Rama Subgrupo A1 - Módulo Técnico)
      │    ├── a1-pignataro  (Sofia Pignataro - Líder A1)
      │    ├── a1-perez      (Santiago Pérez)
      │    ├── a1-marin      (Sol Marín)
      │    └── a1-desantis   (Brenda De Santis)
      │
      ├── a2  (Rama Subgrupo A2 - Módulo Cliente)
      │    ├── a2-frete-tobias  (Tobías Frete - Líder A2)
      │    ├── a2-frete-thiago  (Thiago Frete)
      │    ├── a2-barrios       (Aaron Barrios)
      │    └── a2-pogonza       (Santiago Pogonza)
      │
      └── a3  (Rama Subgrupo A3 - Módulo Depósito / Stock)
           ├── a3-enriquez      (Santino Enríquez - Líder A3)
           ├── a3-jimenez       (Juan Jiménez)
           ├── a3-barrionuevo   (Lucas Barrionuevo)
           └── a3-duarte        (Gabriel Duarte)
```

---

## 💻 1. Guía para Desarrolladores (Ramas Individuales `aX-apellido`)

Esta sección aplica a **todos los alumnos** para el desarrollo de tareas individuales.

> [!IMPORTANT]
> **Pusheo directo bloqueado:** Nadie puede pushear directamente a `main`, `develop`, `a1`, `a2` ni `a3`. Todo cambio debe enviarse mediante una Pull Request (PR).

### Paso 1: Posicionarte en tu rama individual
Al iniciar la clase o tu jornada de trabajo, abre la terminal en tu proyecto:

```bash
# Ejemplo para una alumna del Subgrupo A1 (ej. Sofia Pignataro)
git checkout a1-pignataro
git pull origin a1-pignataro
```

### Paso 2: Guardar avances (Commits)
Trabaja en los archivos correspondientes a tu módulo. Realiza commits frecuentes con mensajes descriptivos:

```bash
# 1. Preparar archivos modificados
git add .

# 2. Hacer el commit con mensaje descriptivo convencional
git commit -m "feat(tecnico): agregar boton de check-in por gps"
```

### Paso 3: Subir tu rama a GitHub
Sube tus cambios locales a tu rama remota en GitHub:

```bash
git push origin a1-pignataro
```

### Paso 4: Abrir Pull Request (PR) hacia tu rama de subgrupo
1. Ingresa al repositorio en GitHub: [TechSolutions](https://github.com/TechSolutions-J-F-Kennedy/TechSolutions).
2. Haz clic en la pestaña **"Pull requests"**.
3. Haz clic en el botón verde **"New pull request"**.
4. Selecciona las ramas de origen y destino:
   * **base:** `a1` *(o `a2` / `a3` según tu subgrupo — ¡NUNCA a `main` ni `develop` directamente!)*
   * **compare:** `a1-pignataro` *(tu rama individual)*
5. Haz clic en el botón **"Create pull request"**.
6. En la pantalla final de envío:
   * Escribe un **Título** claro y una **Descripción** de lo que realizaste.
   * En el panel derecho (**Reviewers**), selecciona al **Líder de tu Subgrupo** (Sofia Pignataro en A1, Tobías Frete en A2, Santino Enríquez en A3).
   * Haz clic en el botón verde **"Create pull request"** para confirmarla.

---

## 🔍 2. Guía para Líderes de Subgrupo (Ramas de Grupo `a1`, `a2`, `a3`)

Esta sección aplica a los **Líderes elegidos en los Subgrupos A1, A2 y A3** (Sofia Pignataro, Tobías Frete y Santino Enríquez).

### Responsabilidad Principal:
Revisar las Pull Requests que envían los integrantes de tu subgrupo a la rama `aX`, validar que el código funcione y aprobar la integración.

### Paso 1: Revisar una Pull Request entrante
1. En GitHub, ve a la pestaña **"Pull requests"**.
2. Abre la PR enviada por tu compañero de grupo.
3. Ve a la pestaña **"Files changed"** (Archivos modificados).
4. **Lista de Verificación de Revisión:**
   - [ ] ¿El código cumple la función solicitada?
   - [ ] ¿Modifica únicamente los archivos de su módulo sin borrar código ajeno?
   - [ ] ¿El mensaje de commit y la descripción son claros?

### Paso 2: Aprobar o Solicitar Cambios
* **Si falta algo o hay errores:** Escribe un comentario constructivo en la línea de código afectada y haz clic en **"Request changes"**.
* **Si todo está correcto:** Haz clic en **"Review changes"** $\rightarrow$ selecciona **"Approve"** $\rightarrow$ **"Submit review"**.

### Paso 3: Realizar el Merge
Una vez aprobada la PR:
1. Haz clic en **"Merge pull request"**.
2. Haz clic en **"Confirm merge"**.

### Paso 4: Abrir PR del Subgrupo hacia `develop`
Al finalizar un Sprint o cuando el módulo de tu grupo tenga una versión funcional completa:
1. Ve a **"Pull requests"** $\rightarrow$ **"New pull request"**.
2. Configura:
   * **base:** `develop`
   * **compare:** `a1` *(la rama de tu subgrupo)*
3. Asigna como reviewers a **Thiago Frete** (Líder General), **Aaron Barrios** (Líder DB/Cloud) y al **Profesor**.

---

## 👑 3. Guía para Thiago Frete y Aaron Barrios (Admin & Líderes Generales)

Esta sección aplica a **Thiago Frete** (Repo Owner / Líder General) y **Aaron Barrios** (Líder DB & Cloud).

### Responsabilidades Clave:
1. **Gobernanza de `develop` y `main`:** Asegurar que solo ingresen a `develop` las ramas de subgrupo (`a1`, `a2`, `a3`) previamente revisadas.
2. **Revisión de Integración:** Verificar que los 3 módulos no generen conflictos al unirse en `develop` y que la BD en Aiven MySQL Cloud responda correctamente.

### Paso 1: Integración en `develop`
1. Al recibir una PR de un líder de subgrupo (ej. `a1` $\rightarrow$ `develop`):
2. Revisa que el módulo esté probado en móvil/desktop.
3. Aprueba el PR y realiza el **Merge**.

### Paso 2: Publicación a `main` (Cierre de Sprint / Entregables)
Cuando los 3 módulos integrados en `develop` funcionen correctamente:
1. Abre una Pull Request desde `develop` hacia `main`:
   * **base:** `main`
   * **compare:** `develop`
2. Solicita la revisión final al **Profesor**.
3. Realiza el **Merge** para consolidar la versión estable del proyecto.

### ⚠️ Resolución de Conflictos de Merge en GitHub
Si GitHub indica **"Can't automatically merge"**:
1. Haz clic en **"Resolve conflicts"** dentro del panel de la PR en GitHub.
2. Identifica las marcas de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Coordina con los líderes de los grupos involucrados para conservar el código correcto.
4. Marca el conflicto como resuelto (**"Mark as resolved"**) y completa el Merge.

---

📌 *Guía Oficial de Gobernanza Git — Kennedy Tech Solutions (E.E.S.T. N° 5 - 2026)*
