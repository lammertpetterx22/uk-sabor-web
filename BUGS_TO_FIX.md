# 🐛 Bugs encontrados en consabor.uk — Para Claude Code

Fecha de auditoría: 2026-03-25  
Sitio testeado: https://www.consabor.uk/  
Proyecto: `/Users/lammert/Desktop/uk-sabor-web`

---

## BUG 1 — CRÍTICO: Página `/profile` completamente rota

**Descripción:** La página de perfil de usuario (`/profile`) NO carga nunca. Muestra un error "Error loading Profile" con botones "Try Again" y "Go Home". El botón "Try Again" no funciona.

**Causa técnica:** El archivo JavaScript `UserProfile-BtjuPuME.js` que se importa dinámicamente (lazy loading) devuelve un **404 Not Found**. Esto significa que el build deployado en producción tiene los hashes de los archivos desactualizados — los chunks JS generados por Vite no coinciden con los que están en el servidor.

**Error en consola:**
```
TypeError: Failed to fetch dynamically imported module: https://www.consabor.uk/assets/UserProfile-BtjuPuME.js
```

**Cómo reproducir:**
1. Ir a https://www.consabor.uk/
2. Registrarse o loguearse
3. Ir a `/profile`
4. La página muestra "Error loading Profile"

**Fix necesario:** Hacer un nuevo build (`npm run build` en `/client`) y re-deployar TODOS los archivos de `/client/dist/assets/` al servidor. Los hashes de los chunks JS del build actual no coinciden con los archivos disponibles en el servidor.

---

## BUG 2 — CRÍTICO: Múltiples assets JS devuelven 404

**Descripción:** Varios archivos JavaScript que se cargan dinámicamente (code splitting de Vite) devuelven 404. Esto causa errores en múltiples páginas y componentes que no renderizan correctamente.

**Archivos afectados (todos en `/assets/`):**
- `UserProfile-BtjuPuME.js` (rompe `/profile`)
- `circle-check-big-Dud2Ckrv.js` (ícono faltante)
- `external-link-DDaOrNXk.js` (ícono faltante)
- `trending-up-CccWnyf8.js` (ícono faltante)

**Error en consola:**
```
TypeError: Failed to fetch dynamically imported module
```

**Fix necesario:** Mismo que Bug 1 — re-build y re-deploy. Es un problema de deployment, no de código. Si el deployment es automático (CI/CD), revisar que el pipeline esté haciendo build correctamente y subiendo TODOS los archivos generados.

---

## BUG 3 — MAYOR: Sidebar se abre automáticamente al cargar la página

**Descripción:** Cuando un usuario visita la página por primera vez, el sidebar de navegación (menú lateral) se abre automáticamente, cubriendo todo el contenido principal con un efecto de blur/oscurecimiento. El usuario tiene que cerrar el sidebar manualmente antes de poder ver el homepage.

**Cómo reproducir:**
1. Abrir https://www.consabor.uk/ en una ventana de incógnito
2. El sidebar aparece abierto tapando todo

**Archivo a revisar:** `client/src/components/Layout.tsx` — buscar el estado inicial del sidebar. Probablemente hay un `useState(true)` o similar que debería ser `useState(false)`.

**Fix necesario:** Cambiar el estado inicial del sidebar a **cerrado** (`false`). El sidebar solo debería abrirse cuando el usuario hace clic en el ícono del menú hamburguesa (☰).

---

## BUG 4 — MAYOR: Estado de sesión inconsistente en el header

**Descripción:** Después de loguearse, al navegar de vuelta al homepage, el header a veces muestra el botón "Login" en vez del avatar/inicial del usuario — aunque la sesión está activa (si navegas a `/dashboard` funciona bien).

**Cómo reproducir:**
1. Loguearse en la web
2. Ir al Dashboard (funciona, muestra el nombre del usuario)
3. Navegar al homepage
4. El header muestra "Login" en vez del avatar del usuario
5. Pero si vas a `/dashboard` directamente, la sesión sigue activa

**Causa probable:** El componente del header no está verificando correctamente el estado de autenticación, o hay una race condition donde el estado de auth se pierde momentáneamente durante la navegación entre rutas.

**Archivos a revisar:**
- `client/src/components/Layout.tsx` (header/navbar)
- El store/context de autenticación
- Verificar que el estado de auth se persiste y se lee correctamente en cada render del header

---

## BUG 5 — MENOR: Favicon faltante (404)

**Descripción:** No hay archivo `favicon.ico` deployado. Cada carga de página genera un error 404 en la consola para `favicon.ico`.

**Fix necesario:** Agregar un `favicon.ico` o un `<link rel="icon">` al `index.html` apuntando a un ícono existente (por ejemplo el logo de Sabor que ya se usa en el header).

**Archivo a revisar:** `client/index.html` — agregar `<link rel="icon" href="/favicon.ico" />` y asegurar que el archivo exista en `client/public/`.

---

## BUG 6 — MENOR: Texto de loading en español mezclado con UI en inglés

**Descripción:** El spinner de carga muestra "Cargando..." (español) pero el resto de la interfaz está en inglés. Debería ser consistente.

**Cómo reproducir:**
1. Ir a `/classes`
2. Mientras carga, aparece "Cargando..." en vez de "Loading..."

**Fix necesario:** Buscar todas las instancias de "Cargando" en el código del frontend y reemplazarlas por "Loading" (o implementar i18n si se planea soportar múltiples idiomas).

**Comando para encontrar las instancias:**
```bash
grep -r "Cargando" client/src/
```

---

## BUG 7 — MENOR: Datos de prueba visibles en producción

**Descripción:** Hay un curso llamado "Dddd" creado por "Sára Bartosova" visible para todos los usuarios en la página de Courses y en el homepage (sección "Featured Courses"). Esto es claramente un dato de prueba.

**Fix necesario:** Eliminar este curso de prueba de la base de datos o marcarlo como draft/no publicado. Esto es un fix de datos, no de código.

---

## Resumen de prioridad

| # | Bug | Severidad | Tipo de fix |
|---|-----|-----------|-------------|
| 1 | Profile page rota (404 JS) | 🔴 CRÍTICO | Re-deploy |
| 2 | Múltiples 404 en assets JS | 🔴 CRÍTICO | Re-deploy |
| 3 | Sidebar abierto por defecto | 🟠 MAYOR | Código (`Layout.tsx`) |
| 4 | Sesión inconsistente en header | 🟠 MAYOR | Código (auth state) |
| 5 | Favicon faltante | 🟡 MENOR | Agregar archivo |
| 6 | "Cargando..." en vez de "Loading..." | 🟡 MENOR | Código (strings) |
| 7 | Datos de prueba visibles | 🟡 MENOR | Base de datos |
