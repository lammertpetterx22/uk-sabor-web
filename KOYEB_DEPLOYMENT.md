# 🚀 Koyeb Deployment Guide - UK Sabor Web

## ✅ Pre-deployment Checklist

El proyecto ya está configurado con:

- ✅ **Procfile** - Comando de inicio para Koyeb
- ✅ **Health Check** - Endpoint `/health` disponible
- ✅ **Puerto dinámico** - Lee `PORT` del entorno automáticamente
- ✅ **Build scripts** - Configurados en `package.json`
- ✅ **Production mode** - NODE_ENV=production

---

## 📋 Configuración en Koyeb

### 1. **Tipo de Servicio**
- **Service type**: Web Service
- **Builder**: Buildpack (detección automática de Node.js)

### 2. **Comandos de Build**

**Build Command**:
```bash
pnpm install && npm run build
```

**Start Command**:
```bash
npm run start
```

O simplemente usa el **Procfile** que ya está configurado.

### 3. **Variables de Entorno Requeridas**

#### 🔐 Base de Datos
```
DATABASE_URL=postgresql://user:password@host:port/database
```

#### 🔑 Autenticación
```
JWT_SECRET=tu-secret-key-muy-segura
```

#### 💳 Stripe
```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### 🎥 Bunny.net - Video Streaming
```
BUNNY_API_KEY=617a8784-3cd4-4d83-9bd774cc6826-bd70-4992
BUNNY_VIDEO_LIBRARY_ID=616736
BUNNY_ALLOWED_REFERRER=https://tu-app.koyeb.app
```

#### 🖼️ Bunny.net - Storage (Imágenes)
```
BUNNY_STORAGE_ZONE=uk-sabor
BUNNY_STORAGE_API_KEY=3676c5c0-86dc-4ed3-ab67eb67acf6-0245-40c7
BUNNY_CDN_URL=https://uk-sabor.b-cdn.net
```

#### 📧 Email (Resend)
```
RESEND_API_KEY=re_xxx
```

#### ⚙️ Sistema
```
NODE_ENV=production
NODE_VERSION=20
```

**IMPORTANTE**: No es necesario configurar `PORT` - Koyeb lo asigna automáticamente.

---

## 🏥 Health Checks

Koyeb usa health checks para verificar que tu app está funcionando.

**Endpoint configurado**: `/health`

**Respuesta esperada**:
```json
{
  "status": "ok",
  "timestamp": 1710560000000
}
```

**Configuración recomendada en Koyeb**:
- **Health check path**: `/health`
- **Port**: El que Koyeb asigna automáticamente
- **Interval**: 30 segundos
- **Timeout**: 10 segundos
- **Grace period**: 120 segundos (para permitir build inicial)

---

## 📦 Build Process

El build ejecuta estos pasos:

1. **pnpm install** - Instala dependencias
2. **vite build** - Compila React frontend → `dist/public/`
3. **esbuild** - Bundle del backend → `dist/index.js`
4. **npm run start** - Ejecuta `node dist/index.js`

**Tiempo estimado de build**: ~2-3 minutos

---

## 🔍 Troubleshooting

### Error: "The command to launch your application is not defined"
✅ **Solución**: El `Procfile` ya está creado con:
```
web: node dist/index.js
```

### Error: "Failed to pass initial health checks"
✅ **Solución**:
- Verifica que el endpoint `/health` esté respondiendo
- Aumenta el "Grace period" a 120-180 segundos
- Revisa los logs de deployment

### Error: "Not enough resources"
✅ **Solución**:
- Usa al menos el plan **Starter** ($5/mes)
- El plan Free puede ser insuficiente para este proyecto (tiene muchas dependencias)

### Error: "Port already in use"
✅ **Solución**: Ya está arreglado. La app ahora usa el PORT que Koyeb asigna automáticamente.

### Error: "Module not found" durante el build
✅ **Solución**:
- Verifica que `pnpm install` se ejecutó correctamente
- Asegúrate de que todas las dependencias estén en `dependencies` (no solo en `devDependencies`)

---

## 📊 Instance Recommendations

### Minimum (Para testing)
- **Instance Type**: Eco
- **Region**: Closest to your users (ej: London, Frankfurt)
- **Replicas**: 1

### Recommended (Producción)
- **Instance Type**: Standard Small o Medium
- **Region**: Multi-region para mejor disponibilidad
- **Replicas**: 2+ para alta disponibilidad
- **Auto-scaling**: Habilitado

---

## 🔄 Deployment Workflow

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: Deploy to Koyeb"
   git push origin main
   ```

2. **Koyeb Auto-Deploy** (si está configurado):
   - Detecta el push
   - Ejecuta build automáticamente
   - Ejecuta health checks
   - Hace rollout si todo está OK

3. **Manual Deploy**:
   - Ir al dashboard de Koyeb
   - Clic en "Redeploy"
   - Esperar build + health checks

---

## 🎯 Post-Deployment

Después del primer deploy exitoso:

1. **Verificar Health Check**:
   ```bash
   curl https://tu-app.koyeb.app/health
   ```

2. **Probar Frontend**:
   - Visita `https://tu-app.koyeb.app`
   - Debe cargar la página de inicio

3. **Probar API**:
   ```bash
   curl https://tu-app.koyeb.app/api/trpc/health.check?input=%7B%22timestamp%22%3A123%7D
   ```

4. **Configurar Webhook de Stripe**:
   - Ir a Stripe Dashboard → Webhooks
   - Agregar endpoint: `https://tu-app.koyeb.app/api/stripe/webhook`
   - Seleccionar eventos: `checkout.session.completed`, `payment_intent.succeeded`, etc.

5. **Actualizar Bunny.net Allowed Referrer**:
   - Ir a Bunny.net Dashboard
   - Stream Library → Security
   - Agregar: `https://tu-app.koyeb.app`

---

## 📝 Logs & Monitoring

Para ver logs en Koyeb:
1. Dashboard → Tu servicio
2. Tab "Logs"
3. Filtrar por: `error`, `warn`, `info`

**Logs importantes a monitorear**:
- `Server running on...` - Confirma que inició correctamente
- `[EmailMarketing] Failed...` - Errores en email
- `[ScheduledCampaigns]...` - Procesador de campañas
- Stripe webhook errors

---

## 🚨 Common Issues After Deployment

### 1. Videos no cargan
- Verifica `BUNNY_ALLOWED_REFERRER` en variables de entorno
- Revisa que apunte a tu dominio de Koyeb

### 2. Pagos fallan
- Verifica `STRIPE_WEBHOOK_SECRET`
- Configura webhook en Stripe Dashboard

### 3. Emails no se envían
- Verifica `RESEND_API_KEY`
- Revisa logs de Resend

### 4. Base de datos no conecta
- Verifica `DATABASE_URL`
- Asegúrate de que la IP de Koyeb esté permitida en Supabase

---

## ✅ Deployment Checklist

- [ ] Procfile creado
- [ ] Health endpoint funcionando (`/health`)
- [ ] Build local exitoso (`npm run build`)
- [ ] Variables de entorno configuradas en Koyeb
- [ ] Health check configurado (path: `/health`)
- [ ] Grace period ≥ 120 segundos
- [ ] Instance type adecuado (mínimo Eco)
- [ ] Stripe webhook configurado
- [ ] Bunny.net allowed referrer actualizado
- [ ] Logs monitoreados post-deploy

---

## 🎉 ¡Listo!

Tu aplicación UK Sabor Web está lista para deployar en Koyeb.

**Next Steps**:
1. Sube los cambios a GitHub
2. Configura el servicio en Koyeb con los parámetros de arriba
3. Espera el build (~2-3 min)
4. Verifica health checks
5. ¡Disfruta tu app en producción! 🚀

---

**Última actualización**: 2026-03-16
**Proyecto**: UK Sabor - Latin Dance Platform
**Deploy target**: Koyeb
