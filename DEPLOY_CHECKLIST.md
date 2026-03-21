# ✅ CHECKLIST PRE-DEPLOY A KOYEB

## 📋 Estado del Código
- [x] Build exitoso (`pnpm run build`)
- [x] Health endpoint `/health` funcionando
- [x] Procfile configurado correctamente
- [x] Servidor inicia sin errores

## 🔧 Configuración en Koyeb (Dashboard)

### Variables de Entorno CRÍTICAS

#### 🔐 Base de Datos (Supabase/Neon)
```
DATABASE_URL=postgresql://[usuario]:[password]@[host]/[database]
```
⚠️ USAR LA URL DE PRODUCCIÓN, NO LA DE DESARROLLO

#### 🔑 Autenticación
```
JWT_SECRET=[genera un string aleatorio de 64+ caracteres]
```
Generar con: `openssl rand -hex 64`

#### 💳 Stripe
```
STRIPE_SECRET_KEY=sk_live_... (o sk_test_ si aún estás en testing)
STRIPE_WEBHOOK_SECRET=whsec_... (obtenerlo DESPUÉS de configurar webhook)
```

#### 🎥 Bunny.net - Video
```
BUNNY_API_KEY=617a8784-3cd4-4d83-9bd774cc6826-bd70-4992
BUNNY_VIDEO_LIBRARY_ID=616736
BUNNY_ALLOWED_REFERRER=https://[tu-app].koyeb.app
```

#### 🖼️ Bunny.net - Storage (Imágenes)
```
BUNNY_STORAGE_ZONE=uk-sabor
BUNNY_STORAGE_API_KEY=3676c5c0-86dc-4ed3-ab67eb67acf6-0245-40c7
BUNNY_CDN_URL=https://uk-sabor.b-cdn.net
```

#### 📧 Email (Resend)
```
RESEND_API_KEY=re_...
```

#### ⚙️ Sistema
```
NODE_ENV=production
NODE_VERSION=20
```

## 🚀 Pasos del Deploy

1. **Configurar KOYEB_TOKEN**
   ```bash
   export KOYEB_TOKEN="koyeb_..."
   ```

2. **Ejecutar script de deploy**
   ```bash
   ./.koyeb-deploy.sh
   ```

3. **Configurar variables de entorno** en Koyeb Dashboard

4. **Esperar build** (~2-3 minutos)

5. **Verificar health check** pasa exitosamente

6. **Configurar Stripe Webhook**
   - URL: `https://[tu-app].koyeb.app/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `payment_intent.succeeded`

7. **Actualizar Bunny.net Allowed Referrer**
   - Agregar: `https://[tu-app].koyeb.app`

## 🧪 Testing Post-Deploy

```bash
# 1. Health check
curl https://[tu-app].koyeb.app/health

# 2. Frontend
# Abrir en navegador: https://[tu-app].koyeb.app

# 3. Probar login/registro

# 4. Probar que los cursos/eventos se muestren

# 5. Probar el carrito (agregar items)
```

## ⚠️ IMPORTANTE

- NO usar variables de desarrollo en producción
- Regenerar JWT_SECRET para producción
- Usar Stripe LIVE keys solo cuando estés listo para recibir pagos reales
- Verificar que la IP de Koyeb esté permitida en Supabase

