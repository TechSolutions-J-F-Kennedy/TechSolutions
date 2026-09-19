# 🔀 Guía de Git y Flujo de Trabajo en Repositorio

---

## 🌳 Estructura de Ramas

1. `main`: Código estable y publicado en producción.
2. `develop`: Rama de integración principal.
3. `a1`: Rama base para el Módulo Técnico.
4. `a2`: Rama base para el Módulo Cliente.
5. `a3`: Rama base para el Módulo Depósito / Stock.
6. `a-apellido`: Ramas personales de trabajo individual (ej: `a-frete-thiago`, `a-barrios`, `a-perez`).

---

## 🔄 Reglas de Commits y Pull Requests

1. **Protección de Ramas**: Las ramas `main`, `develop`, `a1`, `a2` y `a3` requieren al menos 1 revisión aprobada para fusionar código. No se permite push directo.
2. **Mensajes de Commit Convencionales**:
   - `docs: actualizar guía de base de datos`
   - `feat: agregar boton de check-in por gps`
   - `fix: corregir lectura de qr en camara`
3. **Flujo diario**:
   - Trabajar siempre en la rama personal `a-apellido`.
   - Abrir Pull Request hacia la rama del subgrupo (`a1`, `a2` o `a3`).
   - Una vez probado el subgrupo, el líder abre PR hacia `develop`.
