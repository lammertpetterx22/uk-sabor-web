# ✅ POST-DEPLOY CHECKLIST - Sistema de Video Adaptable

**Fecha de Deploy**: 2026-03-13
**Commit**: `feat: sistema de video adaptable multi-formato completo`
**Status**: 🚀 Desplegado a producción

---

## 📋 VERIFICACIÓN POST-DEPLOY

### 1. ✅ Verificar que Render Completó el Build

**URL del Dashboard**: https://dashboard.render.com

**Pasos**:
1. Ve a tu dashboard de Render
2. Busca el servicio `uk-sabor-web`
3. Verifica que el deploy esté en estado: **✅ Live**
4. Revisa los logs para confirmar que no hay errores

**Logs esperados**:
```
Building...
✓ 1846 modules transformed
✓ built in X.XXs
Deploy live
```

---

### 2. ✅ Verificar Variables de Entorno en Render

**Dashboard → uk-sabor-web → Environment**

Confirma que estas variables existen:
```
✅ BUNNY_API_KEY=d13c6575-3b2d-490f-bca7-e3df257fb5ada4506b8e-7a74-432e-839e-7a6128f74efb
✅ BUNNY_VIDEO_LIBRARY_ID=616736
✅ BUNNY_ALLOWED_REFERRER=https://uk-sabor-web.onrender.com
```

Si faltan, agrégalas y redeploy.

---

### 3. 🧪 PRUEBAS FUNCIONALES

#### Paso 1: Subir un Video de Prueba

1. **Accede al Admin Dashboard**:
   ```
   https://uk-sabor-web.onrender.com/admin
   ```

2. **Navega a Lecciones**:
   ```
   Admin Dashboard → Lecciones → Crear Lección
   ```

3. **Crea una lección de prueba**:
   - **Curso**: Selecciona un curso existente
   - **Título**: "Test Video Adaptable"
   - **Video**: Sube un video (cualquier formato: mp4, mov, avi, webm)
   - **Formato recomendado para testing**:
     - Horizontal (16:9): Video de clase tradicional
     - Vertical (9:16): Video estilo TikTok/Reels
     - Cuadrado (1:1): Video estilo Instagram

4. **Verifica la subida**:
   - ✅ El video sube sin errores
   - ✅ Aparece mensaje: "Video subido exitosamente"
   - ✅ Recibes `bunnyVideoId` y `bunnyLibraryId`

#### Paso 2: Verificar el Reproductor

1. **Accede al curso desde el frontend**:
   ```
   https://uk-sabor-web.onrender.com/courses/{course_id}
   ```

2. **Compra el curso** (si no lo tienes):
   - Click en "Comprar"
   - Completa el checkout de prueba

3. **Selecciona la lección de prueba**:
   - Click en la lección que subiste

4. **Verifica el reproductor**:
   - ✅ **Loading state aparece** mientras carga
   - ✅ **Video se renderiza correctamente** (no height: 0)
   - ✅ **Aspect ratio correcto**:
     - Horizontal (16:9): Full width
     - Vertical (9:16): Max width 500px, centrado
     - Cuadrado (1:1): Max width 600px, centrado
   - ✅ **Play button visible** cuando está pausado
   - ✅ **Controles de velocidad funcionan** (0.5x - 2x)
   - ✅ **Barra de progreso** con color #FA3698
   - ✅ **Watermark visible**: "Con Sabor · {título}"

#### Paso 3: Verificar Responsive Design

**Desktop** (Ancho > 1024px):
- ✅ Video horizontal: Full width del contenedor
- ✅ Video vertical: Centrado, max 500px
- ✅ Controles visibles y funcionales

**Tablet** (768px - 1024px):
- ✅ Videos se adaptan al ancho disponible
- ✅ Controles de velocidad accesibles

**Mobile** (< 768px):
- ✅ Video vertical: Ocupa casi todo el ancho
- ✅ Controles grandes para touch
- ✅ Play button fácil de tocar

---

### 4. 🐛 Depuración de Problemas Comunes

#### Problema: Video no se ve (height: 0)

**Causa**: `bunnyVideoId` o `bunnyLibraryId` no llegaron al frontend

**Solución**:
1. Abre la consola del navegador (F12)
2. Busca el log:
   ```
   [CourseDetail] Selected lesson: {
     bunnyVideoId: "...",
     bunnyLibraryId: "616736"
   }
   ```
3. Si `bunnyVideoId` es `null`, verifica:
   - La lección tiene video en la BD
   - El usuario compró el curso
   - Las variables de entorno están configuradas

#### Problema: Error "Bunny.net API key missing"

**Causa**: Variables de entorno no configuradas en Render

**Solución**:
1. Ve a Render Dashboard → Environment
2. Agrega:
   ```
   BUNNY_API_KEY=d13c6575-3b2d-490f-bca7-e3df257fb5ada4506b8e-7a74-432e-839e-7a6128f74efb
   BUNNY_VIDEO_LIBRARY_ID=616736
   ```
3. Redeploy el servicio

#### Problema: Video se ve pero no detecta el formato

**Causa**: Evento `loadedmetadata` no se dispara

**Solución**:
1. Verifica los logs en la consola:
   ```
   [BunnyPlayer] Detected: Horizontal (16:9)
   ```
2. Si no aparece, el iframe de Bunny.net puede tardar en cargar
3. Recarga la página

#### Problema: Lección bloqueada cuando debería estar desbloqueada

**Causa**: Lógica de `isLessonUnlocked` en `LessonList.tsx`

**Solución**:
1. Verifica que compraste el curso
2. Completa la lección anterior (debe estar al 95%+)
3. Revisa la tabla `lesson_progress` en la BD

---

### 5. 📊 Métricas de Rendimiento

**Verifica en la consola del navegador**:

**Tiempo de carga del video**:
```
[BunnyPlayer] Video player ready
```
- ✅ Debe aparecer en < 3 segundos

**Tamaño del bundle**:
```
../dist/public/assets/CourseDetail-*.js: ~40kB gzip
```
- ✅ No debe exceder 50kB gzip

**Eventos de progreso**:
```
[BunnyPlayer] Video completed (95%)
```
- ✅ Debe disparar cuando el video alcance 95%

---

### 6. 🔐 Verificación de Seguridad

**URLs Firmadas**:
- ✅ La URL del video incluye `?token=...&expires=...`
- ✅ La URL expira en 24 horas
- ✅ No se puede copiar y pegar en otro navegador (referrer restriction)

**Protección contra descarga**:
- ✅ Click derecho bloqueado en el video
- ✅ No hay opción de descarga en los controles
- ✅ F12 (DevTools) bloqueado con advertencia

**Watermark**:
- ✅ Visible en la esquina superior derecha
- ✅ Texto: "Con Sabor · {título de lección}"
- ✅ No se puede remover con CSS inspector

---

### 7. 📱 Testing Multi-Dispositivo

**Recomendación**: Usa las DevTools de Chrome para simular dispositivos

**Dispositivos a probar**:
1. **iPhone 14 Pro** (393 × 852, portrait)
   - ✅ Video vertical: Ocupa casi todo el ancho
   - ✅ Controles accesibles con el pulgar

2. **iPad Pro** (1024 × 1366)
   - ✅ Video horizontal: Se ve completo
   - ✅ Lock overlay centrado

3. **Desktop 1920x1080**
   - ✅ Video no se estira más del aspect ratio natural
   - ✅ Controles responsive

---

## ✅ CHECKLIST FINAL

Marca cada item cuando lo hayas verificado:

- [ ] Deploy completado en Render (estado: Live)
- [ ] Variables de entorno configuradas
- [ ] Subida de video exitosa desde Admin Dashboard
- [ ] Video se renderiza correctamente (no height: 0)
- [ ] Auto-detección de formato funciona (16:9, 9:16, 1:1)
- [ ] Loading state aparece mientras carga
- [ ] Play button visible cuando está pausado
- [ ] Controles de velocidad funcionan (0.5x - 2x)
- [ ] Barra de progreso con color #FA3698
- [ ] Watermark visible
- [ ] Lock overlay funcional para lecciones bloqueadas
- [ ] Responsive en mobile (< 768px)
- [ ] Responsive en tablet (768px - 1024px)
- [ ] Responsive en desktop (> 1024px)
- [ ] URLs firmadas con expiración 24h
- [ ] Click derecho bloqueado
- [ ] Sin errores en consola del navegador
- [ ] Sin errores en logs de Render

---

## 🚀 LISTO PARA PRODUCCIÓN

Una vez que hayas completado todos los checks, el sistema está 100% funcional y listo para usuarios reales.

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisa los logs**:
   - Frontend: Consola del navegador (F12)
   - Backend: Render Dashboard → Logs

2. **Verifica la documentación**:
   - [SOLUCION_DEFINITIVA_VIDEO.md](SOLUCION_DEFINITIVA_VIDEO.md)

3. **Ejecuta el script de verificación local**:
   ```bash
   ./VERIFICACION_VIDEO.sh
   ```

4. **Bunny.net Dashboard**:
   - https://panel.bunny.net → Stream → Videos
   - Verifica que los videos se hayan subido correctamente

---

**🎉 FELICIDADES - TU SISTEMA DE VIDEO ADAPTABLE ESTÁ EN PRODUCCIÓN**

El reproductor ahora soporta todos los formatos (16:9, 9:16, 1:1) y se adapta automáticamente. Los usuarios pueden disfrutar de una experiencia premium con loading states, controles de velocidad, y estética de marca.
