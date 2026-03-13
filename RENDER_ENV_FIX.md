# 🔧 FIX URGENTE - Configurar Variables de Entorno en Render

## ❌ PROBLEMA ACTUAL

**Error**: `Bunny.net API error (401): Authentication has been denied for this request`

**Causa**: La variable `BUNNY_API_KEY` no está configurada correctamente en Render.com (producción)

---

## ✅ SOLUCIÓN - Configurar Variables en Render

### Paso 1: Accede al Dashboard de Render

1. Ve a: **https://dashboard.render.com**
2. Inicia sesión con tu cuenta
3. Busca el servicio: **`uk-sabor-web`**
4. Click en el servicio para abrirlo

### Paso 2: Ir a Environment

1. En el menú lateral izquierdo, click en **"Environment"**
2. Verás una lista de variables de entorno existentes

### Paso 3: Verificar/Agregar Variables de Bunny.net

Necesitas estas **3 variables CRÍTICAS**:

#### Variable 1: BUNNY_API_KEY
```
Key: BUNNY_API_KEY
Value: [OBTÉN ESTE VALOR DEL ARCHIVO .env LOCAL]
```

**Dónde encontrar el valor**:
- Abre el archivo `.env` en tu proyecto local
- Busca la línea que dice `BUNNY_API_KEY=...`
- Copia el valor completo (después del `=`)

**IMPORTANTE**:
- ✅ Usa el valor EXACTO del archivo `.env` local
- ✅ NO incluyas comillas
- ✅ Verifica que no haya espacios al inicio/final
- ✅ El valor debe ser una cadena larga (UUID)

#### Variable 2: BUNNY_VIDEO_LIBRARY_ID
```
Key: BUNNY_VIDEO_LIBRARY_ID
Value: 616736
```

#### Variable 3: BUNNY_ALLOWED_REFERRER
```
Key: BUNNY_ALLOWED_REFERRER
Value: https://uk-sabor-web.onrender.com
```

### Paso 4: Guardar y Redeploy

1. **Click en "Save Changes"** (botón azul en la parte superior)
2. Render te preguntará si quieres redeploy → **Click "Yes, redeploy"**
3. Espera ~3-5 minutos a que complete el deploy

---

## 📸 GUÍA VISUAL

### Cómo se ve la sección Environment:

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Key                        │ Value                      │
│────────────────────────────┼────────────────────────────┤
│ BUNNY_API_KEY             │ d13c6575-3b2d-490f-bca7... │
│ BUNNY_VIDEO_LIBRARY_ID    │ 616736                     │
│ BUNNY_ALLOWED_REFERRER    │ https://uk-sabor-web...    │
│ DATABASE_URL              │ postgresql://postgres...   │
│ JWT_SECRET                │ 3g$h9dF5@xP2sQ1cL8vN4mB... │
│ STRIPE_SECRET_KEY         │ sk_test_51T74C0Gm6...      │
│ STRIPE_WEBHOOK_SECRET     │ whsec_YDvoY15dt0K0C...     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Botón para agregar nueva variable:

```
[+ Add Environment Variable]
```

Click ahí para agregar cada variable una por una.

---

## 🧪 VERIFICACIÓN POST-CONFIGURACIÓN

### Paso 1: Espera el Redeploy (3-5 min)

Verifica que el deploy esté completo:
- Dashboard de Render → Estado del servicio debe ser: **✅ Live**

### Paso 2: Verifica los Logs

1. En Render Dashboard → Click en **"Logs"**
2. Busca estas líneas (deben aparecer sin errores):
   ```
   [Bunny.net] ✓ API configured
   Server listening on port 10000
   ```

3. **NO** debe aparecer:
   ```
   ❌ Bunny.net API key missing
   ❌ Bunny.net Library ID missing
   ```

### Paso 3: Prueba el Upload

1. Ve a: https://uk-sabor-web.onrender.com/admin
2. Click en tab **"Lecciones"**
3. Selecciona un curso
4. Click en **"Crear Lección"**
5. Sube un video de prueba (cualquier tamaño)

**Resultado esperado**:
```
✅ 📹 Preparando video: test.mp4 (50.3MB)
✅ ☁️ Subiendo a Bunny.net...
✅ ✅ ¡Video subido exitosamente a Bunny.net!
```

**NO debe aparecer**:
```
❌ Error: Bunny.net API error (401)
```

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Problema: Todavía sale error 401 después de configurar

**Solución**:
1. Verifica que copiaste el API key **EXACTAMENTE** del archivo `.env` local
2. El formato debe ser un UUID (letras, números y guiones)
3. NO debe tener:
   - ❌ Espacios al inicio/final
   - ❌ Comillas (`"` o `'`)
   - ❌ Saltos de línea
3. Redeploy de nuevo después de verificar

### Problema: No encuentro el servicio "uk-sabor-web"

**Solución**:
1. Verifica que estás en la cuenta correcta de Render
2. El servicio puede tener otro nombre, busca por:
   - Repository: `lammertpetterx22/uk-sabor-web`
   - URL: `https://uk-sabor-web.onrender.com`

### Problema: El botón "Save Changes" está deshabilitado

**Solución**:
1. Haz un cambio mínimo en alguna variable (agrega un espacio y elimínalo)
2. El botón debería activarse
3. Si no, intenta refrescar la página (F5)

---

## 📋 CHECKLIST COMPLETO

Marca cada item cuando lo completes:

- [ ] Accedí al Dashboard de Render
- [ ] Encontré el servicio `uk-sabor-web`
- [ ] Fui a la sección "Environment"
- [ ] Agregué/verifiqué `BUNNY_API_KEY`
- [ ] Agregué/verifiqué `BUNNY_VIDEO_LIBRARY_ID`
- [ ] Agregué/verifiqué `BUNNY_ALLOWED_REFERRER`
- [ ] Click en "Save Changes"
- [ ] Click en "Yes, redeploy"
- [ ] Esperé ~3-5 minutos (deploy completo)
- [ ] Verifiqué logs (sin errores de Bunny.net)
- [ ] Probé subir video desde Admin Dashboard
- [ ] Video se subió exitosamente sin error 401

---

## 🎯 VARIABLES COMPLETAS REQUERIDAS

Para tu referencia, estas son **TODAS** las variables que deberías tener configuradas en Render:

**IMPORTANTE**: Copia los valores del archivo `.env` local. Los valores aquí son solo ejemplos.

```bash
# Base de datos
DATABASE_URL=[Tu connection string de Supabase]

# JWT
JWT_SECRET=[Tu secret del .env]

# Stripe
STRIPE_SECRET_KEY=[Tu Stripe key del .env]
STRIPE_WEBHOOK_SECRET=[Tu webhook secret del .env]

# OAuth
OAUTH_SERVER_URL=https://uk-sabor-web.onrender.com

# Bunny.net Video Streaming (CRÍTICAS)
BUNNY_API_KEY=[Copia del .env - es un UUID largo]
BUNNY_VIDEO_LIBRARY_ID=616736
BUNNY_ALLOWED_REFERRER=https://uk-sabor-web.onrender.com

# Bunny.net Storage (para imágenes)
BUNNY_STORAGE_ZONE=uk-sabor
BUNNY_STORAGE_API_KEY=[Copia del .env]
BUNNY_CDN_URL=https://uk-sabor.b-cdn.net
```

**Cómo obtener los valores**:
1. Abre el archivo `.env` en tu proyecto local
2. Copia cada valor exactamente como aparece
3. Pégalo en Render (sin comillas ni espacios extra)

---

## 📞 CONTACTO DE EMERGENCIA

Si después de seguir estos pasos el error persiste:

1. **Toma una captura de pantalla** de:
   - La sección "Environment" en Render (con las variables configuradas)
   - El error completo en el navegador (consola F12)
   - Los logs de Render

2. **Verifica el API key en Bunny.net**:
   - Ve a: https://dash.bunny.net/
   - Account → API → Encuentra tu API key
   - Compárala con la que pusiste en Render
   - Si son diferentes, actualiza en Render

---

## ✅ CONFIRMACIÓN FINAL

Una vez completados todos los pasos, deberías poder:
- ✅ Subir videos desde Admin Dashboard sin error 401
- ✅ Ver mensajes de éxito de Bunny.net
- ✅ Reproducir videos en el frontend sin problemas

**El sistema estará 100% funcional en producción.**
