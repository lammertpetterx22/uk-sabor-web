# 🎬 Arreglar Reproducción de Videos en Cursos Comprados

## 🔍 Problema Identificado

Cuando compras un curso, **no puedes ver los videos** porque:

1. ✅ El código del frontend está bien (ProtectedVideoPlayer soporta iframes)
2. ✅ El código del backend está bien (genera videoUrl firmado)
3. ❌ **PERO:** Es probable que la tabla `lessons` no exista o las lecciones no tengan `bunnyVideoId` configurado

---

## 🛠️ Solución: Verificar y Corregir

### Paso 1: Verificar si la tabla `lessons` existe

**En Render.com Dashboard:**

1. Ve a tu servicio → **Shell**
2. Ejecuta:
```bash
psql $DATABASE_URL -c "\d lessons"
```

**Si dice "relation does not exist":**
- La tabla no existe, necesitas crear las tablas

**Si muestra la estructura de la tabla:**
- La tabla existe, continúa al Paso 2

---

### Paso 2: Crear/Migrar las Tablas (si no existen)

**Opción A - Desde Render Shell:**
```bash
cd /opt/render/project/src
npm run db:push
```

**Opción B - Desde tu máquina local:**
```bash
# Asegúrate de tener DATABASE_URL configurado con tu base de datos de producción
npx drizzle-kit push
```

**⚠️ IMPORTANTE:** Si usas Supabase, puedes ejecutar las migraciones desde el SQL Editor:

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `drizzle/0004_military_lester.sql` (o el último archivo de migración)
5. Click en **Run**

---

### Paso 3: Verificar que las lecciones tienen videos

**Ejecuta este SQL en Supabase SQL Editor o en psql:**

```sql
SELECT
  l.id,
  l.title,
  l."courseId",
  l."bunnyVideoId",
  l."bunnyLibraryId",
  l."isPreview",
  c.title as "courseTitle"
FROM lessons l
LEFT JOIN courses c ON l."courseId" = c.id
ORDER BY l."courseId", l.position;
```

**Resultado esperado:**

| id | title | courseId | bunnyVideoId | bunnyLibraryId | courseTitle |
|----|-------|----------|--------------|----------------|-------------|
| 1 | Lección 1 | 3 | abc123 | 616736 | Teacher's Salsa |

**Si `bunnyVideoId` o `bunnyLibraryId` son NULL:**
- 🚨 **Las lecciones NO tienen videos subidos**
- Necesitas subir videos usando el Admin Dashboard

---

### Paso 4: Subir Videos a las Lecciones (si no tienen)

1. **Inicia sesión como Admin**
2. **Ve a Admin Dashboard → Courses**
3. **Edita el curso**
4. **En cada lección, sube un video:**
   - Click en "Upload Video"
   - Selecciona un archivo de video (.mp4, .mov, etc.)
   - Espera a que suba a Bunny.net
   - Verifica que aparezca el `bunnyVideoId`

**El sistema ahora usa Bunny.net Stream:**
- Máximo 2GB por video
- Procesamiento automático
- URLs firmadas con seguridad

---

### Paso 5: Verificar que el Backend Genera videoUrl

**Prueba manual del endpoint:**

```bash
curl -X POST https://uk-sabor-web.onrender.com/api/trpc/lessons.getByCourseId \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{"courseId": 3}'
```

**Respuesta esperada:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "title": "Lección 1",
        "bunnyVideoId": "abc123",
        "bunnyLibraryId": "616736",
        "videoUrl": "https://iframe.mediadelivery.net/embed/616736/abc123?token=...",
        "locked": false
      }
    ]
  }
}
```

**Si `videoUrl` es `null`:**
- Verifica que `bunnyVideoId` y `bunnyLibraryId` existan
- Verifica que el código del backend tenga mi última corrección (commit 6792349)

---

## 🔧 Migración Rápida si No Tienes Lecciones

Si tu curso NO tiene lecciones todavía, puedes crearlas manualmente:

```sql
-- Crear lecciones de ejemplo para el curso ID 3
INSERT INTO lessons ("courseId", title, description, position, "durationSeconds", "isPreview", "bunnyVideoId", "bunnyLibraryId")
VALUES
  (3, 'Introducción a la Salsa', 'Primera lección del curso', 1, 600, true, NULL, NULL),
  (3, 'Pasos Básicos', 'Aprende los movimientos fundamentales', 2, 900, false, NULL, NULL),
  (3, 'Giros y Vueltas', 'Técnicas avanzadas de giros', 3, 1200, false, NULL, NULL);
```

Luego sube videos a cada lección desde el Admin Dashboard.

---

## 🧪 Prueba Final

1. **Compra el curso con una cuenta de prueba**
2. **Ve al curso comprado**
3. **Click en "Empezar Lección 1"**
4. **El video debería cargar en un iframe**

**Si sigue sin funcionar:**

1. Abre DevTools (F12)
2. Ve a la pestaña **Network**
3. Filtra por "getByCourseId"
4. Verifica la respuesta JSON
5. Busca si `videoUrl` está presente y no es `null`

**Si `videoUrl` es `null`:**
- La lección no tiene `bunnyVideoId` configurado
- Necesitas subir el video

**Si `videoUrl` tiene valor pero el video no carga:**
- Verifica la consola de JavaScript por errores
- Verifica que el iframe no esté bloqueado por CORS
- Verifica que la URL firmada no haya expirado (válida 24h)

---

## 📝 Checklist de Verificación

- [ ] La tabla `lessons` existe en la base de datos
- [ ] Las lecciones tienen `bunnyVideoId` y `bunnyLibraryId` configurados
- [ ] El endpoint `getByCourseId` devuelve `videoUrl` (no null)
- [ ] El ProtectedVideoPlayer detecta que es un iframe de Bunny.net
- [ ] El iframe se renderiza correctamente en el navegador
- [ ] El usuario ha comprado el curso (verificar en `coursePurchases`)

---

## 🚨 Problema Común: Tabla Lessons No Existe

**Síntoma:**
```
Error: Failed query: SELECT * FROM lessons
```

**Solución:**
```bash
# Ejecuta las migraciones
npx drizzle-kit push

# O manualmente en Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  "courseId" INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "videoUrl" TEXT,
  "bunnyVideoId" VARCHAR(255),
  "bunnyLibraryId" VARCHAR(255),
  position INTEGER NOT NULL,
  "durationSeconds" INTEGER,
  "isPreview" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

## ✅ Resumen de Commits Realizados

| Commit | Descripción |
|--------|-------------|
| `7c2ba5e` | Soporte para iframes de Bunny.net en ProtectedVideoPlayer |
| `6792349` | Generar videoUrl automáticamente en getByCourseId |

**Ambos commits ya están en production** (si hiciste git push).

---

## 💡 Siguiente Paso

**Ejecuta este comando para verificar el estado actual:**

```bash
npx tsx server/verify-lessons.ts
```

Esto te dirá:
- ✅ Qué cursos existen
- ✅ Qué lecciones tienen videos
- ❌ Qué lecciones NO tienen videos
- ✅ Si las compras existen

---

**¿Necesitas ayuda adicional?** Avísame el resultado de los pasos anteriores y te ayudo a resolver el problema específico.
