# 🚀 DEPLOY A KOYEB - INSTRUCCIONES PASO A PASO

## ✅ VERIFICACIÓN PRE-DEPLOY COMPLETADA

- ✅ Build exitoso
- ✅ Health endpoint funcionando
- ✅ Todos los cambios en Git
- ✅ Código listo para producción

---

## 📋 OPCIÓN 1: DEPLOY MANUAL (RECOMENDADO - MÁS SIMPLE)

### Paso 1: Ir al Dashboard de Koyeb
👉 https://app.koyeb.com/

### Paso 2: Crear Nueva App
1. Clic en **"Create Web Service"**
2. Seleccionar **"GitHub"** como source
3. Conectar tu repositorio: `lammertpetterx22/uk-sabor-web`
4. Branch: `main`

### Paso 3: Configurar Build
**Build command**:
```bash
pnpm install && npm run build
```

**Run command**:
```bash
npm run start
```

### Paso 4: Configurar Variables de Entorno

Copiar y pegar estas variables (¡REEMPLAZA los valores!):

```bash
# Base de Datos (CRÍTICO - USA PRODUCCIÓN)
DATABASE_URL=postgresql://[TU_URL_DE_PRODUCCION]

# Autenticación (CRÍTICO - USA ESTE NUEVO)
JWT_SECRET=0e7ba415f40173afabf55efd571c22597a9351c9cc5b2ae897ebbe74bfb183f14f2baa6f3f77fc925d1d04ce5b4af4ebaa27f31dca21e73d0f7260c4e145b603

# Stripe (usa test keys por ahora)
STRIPE_SECRET_KEY=sk_test_... # Reemplazar con tu key
STRIPE_WEBHOOK_SECRET=whsec_... # Configurar después del deploy

# Bunny.net Video
BUNNY_API_KEY=617a8784-3cd4-4d83-9bd774cc6826-bd70-4992
BUNNY_VIDEO_LIBRARY_ID=616736
BUNNY_ALLOWED_REFERRER=https://uk-sabor-web.koyeb.app

# Bunny.net Storage
BUNNY_STORAGE_ZONE=uk-sabor
BUNNY_STORAGE_API_KEY=3676c5c0-86dc-4ed3-ab67eb67acf6-0245-40c7
BUNNY_CDN_URL=https://uk-sabor.b-cdn.net

# Email
RESEND_API_KEY=re_... # Tu key de Resend

# Sistema
NODE_ENV=production
NODE_VERSION=20
```

### Paso 5: Configurar Health Check
- **Path**: `/health`
- **Port**: 8000 (o el que Koyeb asigne)
- **Grace period**: 120 segundos

### Paso 6: Seleccionar Instance Type
- **Tipo**: Nano o Eco (para empezar)
- **Región**: Frankfurt o London (más cerca de UK)

### Paso 7: Deploy!
Clic en **"Deploy"** y esperar 2-3 minutos

---

## 📋 OPCIÓN 2: DEPLOY CON CLI (REQUIERE TOKEN)

### Paso 1: Instalar Koyeb CLI
```bash
# macOS
brew install koyeb/tap/koyeb-cli

# O con curl
curl -fsSL https://cli.koyeb.com/install.sh | sh
```

### Paso 2: Obtener Token
1. Ir a https://app.koyeb.com/account/api
2. Crear token: "uk-sabor-deploy"
3. Copiar el token

### Paso 3: Configurar Token
```bash
export KOYEB_TOKEN="koyeb_XXX_tu_token_aqui"
```

### Paso 4: Ejecutar Deploy
```bash
./.koyeb-deploy.sh
```

---

## 🔧 CONFIGURACIÓN POST-DEPLOY

### 1. Obtener URL de tu app
Koyeb te dará una URL como:
```
https://uk-sabor-web-[random].koyeb.app
```

### 2. Configurar Stripe Webhook
1. Ir a: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://tu-app.koyeb.app/api/stripe/webhook`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copiar el **Signing secret** (whsec_...)
5. Agregar a Koyeb como `STRIPE_WEBHOOK_SECRET`

### 3. Actualizar Bunny.net Allowed Referrer
1. Ir a Bunny.net Dashboard
2. Stream Library → Security
3. **Allowed referrers**: Agregar `https://tu-app.koyeb.app`
4. Guardar

### 4. Verificar Base de Datos
1. Ir a Supabase/Neon Dashboard
2. Settings → Database
3. **Connection Pooler** → Verificar que la IP de Koyeb esté permitida
4. O habilitar "Allow connections from anywhere"

---

## 🧪 TESTING POST-DEPLOY

### 1. Health Check
```bash
curl https://tu-app.koyeb.app/health
```

**Respuesta esperada**:
```json
{"status":"ok","timestamp":1774065964953}
```

### 2. Frontend
Abrir en navegador:
```
https://tu-app.koyeb.app
```

Deberías ver la página de inicio de UK Sabor

### 3. Probar Carrito
1. Ir a la página
2. Ver el icono del carrito en el header (arriba derecha)
3. Debería tener badge "0"

### 4. Probar Páginas Legales
- `https://tu-app.koyeb.app/terms`
- `https://tu-app.koyeb.app/privacy`

### 5. Probar Formulario
- `https://tu-app.koyeb.app/become-instructor`
- Enviar formulario → Debería aparecer toast de éxito

---

## 🐛 TROUBLESHOOTING

### Error: "Failed health checks"
**Solución**: Aumentar grace period a 180 segundos

### Error: "Build failed"
**Solución**: Verificar que `pnpm install` funcionó
- Revisar logs de build en Koyeb
- Asegurarse de que todas las dependencias estén en `package.json`

### Error: "Database connection failed"
**Solución**:
1. Verificar `DATABASE_URL` esté correcta
2. Permitir IPs de Koyeb en Supabase/Neon
3. Verificar que la BD de producción esté activa

### Videos no cargan
**Solución**: Actualizar `BUNNY_ALLOWED_REFERRER` en variables de entorno

---

## ✅ CHECKLIST FINAL

- [ ] App deployada en Koyeb
- [ ] Health check pasando
- [ ] Frontend carga correctamente
- [ ] Variables de entorno configuradas
- [ ] Stripe webhook configurado
- [ ] Bunny.net allowed referrer actualizado
- [ ] Base de datos accesible
- [ ] Carrito visible en header
- [ ] Páginas legales accesibles
- [ ] Formularios funcionando con toast

---

## 🎉 ¡LISTO!

Tu app UK Sabor Web está en producción.

**URL**: https://tu-app.koyeb.app

**Próximos pasos**:
1. Dominio personalizado (opcional): https://app.koyeb.com/apps/uk-sabor-web/settings/domains
2. Auto-scaling: Configurar en Settings → Scaling
3. Monitoring: Instalar Sentry en producción

---

**Última actualización**: 2026-03-21
**Versión**: v2.0 (con Carrito + Páginas Legales + UX Fixes)
