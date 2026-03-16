# Actualizar Webhooks de Stripe para www.consabor.uk

## 🎯 URLs Actualizadas

Las variables de entorno en Koyeb ya están actualizadas:
- ✅ `OAUTH_SERVER_URL=https://www.consabor.uk`
- ✅ `BUNNY_ALLOWED_REFERRER=https://www.consabor.uk`
- ✅ `DATABASE_URL` (Supabase)
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`

---

## 📝 Pasos para actualizar Stripe Webhooks

### 1. Login a Stripe Dashboard

Ve a: https://dashboard.stripe.com/

### 2. Ir a Webhooks

1. En el menú izquierdo, click en **"Developers"**
2. Click en **"Webhooks"**

### 3. Actualizar o Crear Webhook

**Si ya tienes un webhook configurado:**
1. Click en el webhook existente
2. Click **"..."** (menú) → **"Update details"**
3. Cambia la **Endpoint URL** a:
   ```
   https://www.consabor.uk/api/trpc/stripeWebhook
   ```
4. Save

**Si NO tienes webhook configurado:**
1. Click **"Add endpoint"**
2. **Endpoint URL**:
   ```
   https://www.consabor.uk/api/trpc/stripeWebhook
   ```
3. **Events to send**: Selecciona estos eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **"Add endpoint"**

### 4. Copiar Webhook Secret (Si creaste uno nuevo)

Si creaste un webhook nuevo:
1. Click en el webhook recién creado
2. En la sección **"Signing secret"**, click **"Reveal"**
3. Copia el secret (empieza con `whsec_...`)
4. **Actualiza la variable en Koyeb** (si es diferente):

```bash
export KOYEB_TOKEN="tu_token_aquí"
koyeb service update 27a2455a --env STRIPE_WEBHOOK_SECRET="whsec_NUEVO_SECRET_AQUI"
```

---

## 🧪 Probar el Webhook

### Desde Stripe Dashboard:

1. Ve al webhook configurado
2. Click en **"Send test webhook"**
3. Selecciona `checkout.session.completed`
4. Click **"Send test"**
5. Deberías ver **"200 OK"** en la respuesta

### Desde tu aplicación:

1. Ve a: https://www.consabor.uk
2. Intenta comprar un ticket/curso (modo test)
3. Completa el pago con tarjeta de prueba:
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos
4. Verifica que el webhook se ejecutó en Stripe Dashboard → Webhooks → Events

---

## 🔐 URLs Importantes en Stripe

Actualiza estas URLs en Stripe Dashboard si es necesario:

### Account Settings → Business Settings
- **Business website**: `https://www.consabor.uk`

### Payment Links (si usas)
- Success URL: `https://www.consabor.uk/payment-success`
- Cancel URL: `https://www.consabor.uk/events` (o la página que prefieras)

### OAuth Apps (si usas Stripe Connect)
- Redirect URI: `https://www.consabor.uk/stripe/callback`

---

## ✅ Verificación Final

Una vez configurado, verifica:

```bash
# 1. Health check
curl https://www.consabor.uk/health
# Debe retornar: {"status":"ok","timestamp":...}

# 2. Webhook endpoint (debe retornar 405 Method Not Allowed, es normal)
curl https://www.consabor.uk/api/trpc/stripeWebhook
# Cualquier respuesta que no sea 404 significa que la ruta existe
```

---

## 📊 Variables de Entorno Actuales en Koyeb

```bash
# Database
DATABASE_URL=postgresql://postgres.yajztkmoqhhtbgyogldb:***@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# Stripe
STRIPE_SECRET_KEY=sk_test_51T74C0Gm6hJGlEwH***
STRIPE_WEBHOOK_SECRET=whsec_YDvoY15dt0K0CruYa50pxpBmxucJqBoY

# OAuth & Bunny
OAUTH_SERVER_URL=https://www.consabor.uk ✅
BUNNY_ALLOWED_REFERRER=https://www.consabor.uk ✅
```

---

## 🆘 Troubleshooting

### Webhook falla con 404:
- Verifica que la URL sea exactamente: `https://www.consabor.uk/api/trpc/stripeWebhook`
- Verifica que el servicio esté HEALTHY en Koyeb

### Webhook falla con 401/403:
- Verifica que `STRIPE_WEBHOOK_SECRET` esté correctamente configurado en Koyeb
- Asegúrate de que el secret coincida con el del webhook en Stripe

### Base de datos no conecta:
- Verifica `DATABASE_URL` en Koyeb
- Verifica que Supabase no esté pausado (plan free pausa después de 7 días sin actividad)
- Ve a Supabase dashboard y verifica el status

### Videos no cargan:
- Verifica `BUNNY_ALLOWED_REFERRER=https://www.consabor.uk`
- En Bunny.net dashboard, actualiza los dominios permitidos
- Agrega `www.consabor.uk` a la lista de referrers permitidos

---

**Documentación creada**: 2026-03-16
**Dominio actualizado**: www.consabor.uk
**Status**: Variables de entorno actualizadas en Koyeb ✅
