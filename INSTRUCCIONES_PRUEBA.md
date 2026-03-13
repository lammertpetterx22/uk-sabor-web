# 🎬 INSTRUCCIONES PASO A PASO - Prueba de Subida y Reproducción de Videos

## ⏰ IMPORTANTE: Espera el Deploy

Acabo de hacer **push** de los cambios a producción. Render.com está desplegando automáticamente.

**Espera 5-10 minutos** antes de seguir estos pasos para que el deploy se complete.

Puedes verificar el estado en: https://dashboard.render.com/

---

## 📋 PASO 1: Verificar que el Deploy se Completó

1. Ve a https://dashboard.render.com/
2. Busca tu servicio **uk-sabor-web**
3. Verifica que el último deploy diga **"Deploy succeeded"** o **"Live"**
4. El commit debe ser: `add7593 - fix: aumentar límite a 2GB y agregar gestión completa de lecciones`

---

## 🔐 PASO 2: Hacer Login como Admin

1. Ve a: **https://uk-sabor-web.onrender.com/login**
2. Inicia sesión con tu cuenta de admin:
   - Email: **petterlammert@gmail.com**
   - Contraseña: (tu contraseña)

---

## 📚 PASO 3: Ir al Admin Dashboard

1. Una vez logeado, ve a: **https://uk-sabor-web.onrender.com/admin**
2. Deberías ver el **Admin Dashboard** con varias pestañas

---

## 🆕 PASO 4: Verificar que la Pestaña "Lecciones" Existe

1. En el **Admin Dashboard**, busca las pestañas en la parte superior
2. **Deberías ver 9 pestañas** (antes eran 8):
   - Overview
   - Events
   - Courses
   - **Lecciones** ← ¡NUEVA!
   - Classes
   - Instructors
   - Users
   - Orders
   - Settings

3. **Si NO ves la pestaña "Lecciones"**:
   - Presiona **Ctrl + Shift + R** (o **Cmd + Shift + R** en Mac) para recargar sin caché
   - Si aún no aparece, abre la consola del navegador (F12) y busca errores

---

## 📖 PASO 5: Crear o Seleccionar un Curso

### Opción A: Si ya tienes un curso creado
1. Anota el **ID del curso** o su nombre

### Opción B: Crear un nuevo curso de prueba
1. Ve a la pestaña **"Courses"**
2. Crea un nuevo curso:
   - **Título**: "Curso de Prueba - Videos"
   - **Descripción**: "Prueba del sistema de lecciones"
   - **Instructor**: Selecciona cualquier instructor
   - **Precio**: 10.00
   - **Level**: All levels
   - **Dance Style**: Salsa
   - Click **"Create Course"**

---

## 🎬 PASO 6: Ir a la Pestaña "Lecciones"

1. Click en la pestaña **"Lecciones"**
2. Deberías ver:
   - Un selector de curso (dropdown)
   - Un mensaje: "Selecciona un curso"

---

## 📹 PASO 7: Subir un Video de Prueba

### Preparar un video de prueba:
- **Si tienes un video de 20-40 min**: Úsalo
- **Si NO tienes**: Descarga un video de prueba pequeño (5-10 MB) de aquí:
  - https://sample-videos.com/
  - O usa cualquier video corto que tengas

### Subir el video:

1. **Selecciona el curso** en el dropdown
2. Llena el formulario:
   - **Título de la lección**: "Lección 1 - Introducción"
   - **Posición**: 1
   - **Descripción**: "Primera lección del curso" (opcional)
   - **Duración en segundos**: 600 (opcional)
   - **Marca la casilla**: "Lección de vista previa (gratuita)" ✓

3. **Sube el video**:
   - Click en **"Seleccionar Video"**
   - Elige tu archivo de video
   - Espera a que se suba (verás un mensaje de progreso)

4. **¿Qué debería pasar?**:
   - Verás un mensaje: "☁️ Subiendo a Bunny.net..."
   - Después de unos segundos: "✅ ¡Video subido exitosamente a Bunny.net!"
   - El formulario mostrará el **Video ID** de Bunny.net

5. **Si obtienes un error**:
   - **Error "Video too large"**: El video es mayor a 2GB
   - **Error "Unexpected token '<'"**: El deploy de Render no se completó, espera unos minutos más
   - **Error "BUNNY_API_KEY no está configurado"**: Las variables de entorno no se aplicaron en Render
   - Copia el error completo y avísame

6. Click **"Crear Lección"**

---

## ✅ PASO 8: Verificar que la Lección se Creó

1. Después de crear la lección, deberías ver:
   - Un mensaje: "✅ Lección creada exitosamente"
   - La lección aparece en la lista debajo con:
     - Número de posición (círculo con "1")
     - Título: "Lección 1 - Introducción"
     - Badge verde "Preview"
     - Video ID truncado

---

## 🎥 PASO 9: Verificar en el Frontend

1. Abre una **nueva pestaña** (o ventana de incógnito)
2. Ve a: **https://uk-sabor-web.onrender.com/courses**
3. Click en el curso que creaste ("Curso de Prueba - Videos")
4. Deberías ver:
   - La información del curso
   - Una sección con las lecciones
   - La "Lección 1 - Introducción" con badge "Preview"

---

## ▶️ PASO 10: Intentar Reproducir el Video

### Como usuario NO autenticado (ventana de incógnito):

1. En la página del curso, busca la lección
2. Click en **"Empezar Lección 1"** o el botón de play
3. **¿Qué debería pasar?**:
   - El video debería aparecer en un **iframe** de Bunny.net
   - El reproductor debería tener controles
   - El video debería reproducirse

4. **Si NO se reproduce**:
   - Abre la consola del navegador (**F12** → pestaña "Console")
   - Busca errores en rojo
   - Copia todos los errores y envíamelos

### Como usuario autenticado (con curso comprado):

1. Inicia sesión con una cuenta de prueba
2. **Simula una compra** (puedes hacerlo directamente en la base de datos):
   ```sql
   INSERT INTO "coursePurchases" ("userId", "courseId", "pricePaid", "purchasedAt")
   VALUES ([TU_USER_ID], [COURSE_ID], 10.00, NOW());
   ```
3. Ve al curso
4. Click en "Empezar Lección 1"
5. El video debería reproducirse

---

## 🐛 PASO 11: Reportar Errores

Si algo falla, necesito esta información:

### A. Captura de pantalla de:
1. La pestaña "Lecciones" (si aparece)
2. El mensaje de error (si hay alguno)
3. La consola del navegador (F12 → Console)

### B. Información del navegador:
1. Abre la consola (F12)
2. Ve a la pestaña **"Network"**
3. Intenta subir el video de nuevo
4. Busca las peticiones en rojo (errores)
5. Click en la petición con error
6. Ve a la pestaña **"Response"**
7. Copia el contenido completo

### C. Logs del servidor (si tienes acceso):
1. Ve a Render Dashboard
2. Click en tu servicio
3. Ve a la pestaña **"Logs"**
4. Copia los últimos logs (especialmente los que tengan "ERROR" o "WARN")

---

## ✅ Checklist de Verificación

- [ ] El deploy en Render se completó exitosamente
- [ ] Puedo hacer login como admin
- [ ] Veo el Admin Dashboard
- [ ] Veo la pestaña "Lecciones" (9 pestañas en total)
- [ ] Puedo seleccionar un curso
- [ ] Puedo subir un video sin error "Unexpected token"
- [ ] El video se sube a Bunny.net exitosamente
- [ ] La lección se crea en la base de datos
- [ ] Veo la lección en el frontend (página del curso)
- [ ] Puedo reproducir el video en el iframe

---

## 🆘 Contacto

Si encuentras cualquier error, **por favor envíame**:

1. ✅ En qué paso fallaste (número del paso)
2. ✅ Captura de pantalla del error
3. ✅ Logs de la consola del navegador (F12 → Console)
4. ✅ Response del servidor (F12 → Network → petición con error)

---

**¡Sigue estos pasos y avísame cómo te va!** 🚀
