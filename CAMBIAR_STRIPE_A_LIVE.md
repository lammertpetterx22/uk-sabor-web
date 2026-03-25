# 🚀 Guía Simple: Cambiar Stripe a Modo LIVE

## ⚠️ IMPORTANTE
Actualmente estás en **MODO TEST** - Los pagos NO son reales.
Para recibir pagos reales, sigue estos 3 pasos:

---

## 📋 PASO 1: Obtener claves de Stripe LIVE

### 1.1 Ir a Stripe Dashboard
👉 https://dashboard.stripe.com/

### 1.2 Cambiar a modo "Production"
- Mira la esquina superior derecha
- Verás un toggle que dice **"Test mode"** 🟠
- Haz clic para cambiar a **"Production"** 🟢

### 1.3 Copiar tu Secret Key
1. Ve a **Developers** (menú izquierdo)
2. Haz clic en **API keys**
3. Busca **"Secret key"** que empieza con `sk_live_...`
4. Haz clic en **"Reveal live key"**
5. Copia la clave completa (ejemplo: `sk_live_51ABC...XYZ`)

⚠️ **NO compartas esta clave con nadie**

---

## 📋 PASO 2: Crear Webhook en Stripe

### 2.1 Ir a Webhooks
1. En Stripe Dashboard, ve a **Developers** → **Webhooks**
2. Asegúrate de estar en modo **"Production"** 🟢
3. Haz clic en **"Add endpoint"**

### 2.2 Configurar el webhook
1. **Endpoint URL**: Pega exactamente esto:
   ```
   https://www.consabor.uk/api/stripe/webhook
   ```

2. **Events to send**: Haz clic en **"Select events"** y marca estos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

3. Haz clic en **"Add endpoint"**

### 2.3 Copiar Signing Secret
1. Después de crear el webhook, verás **"Signing secret"**
2. Haz clic en **"Reveal"** o **"Click to reveal"**
3. Copia la clave completa (ejemplo: `whsec_ABC...XYZ`)

---

## 📋 PASO 3: Actualizar claves en Koyeb

### 3.1 Ir a Koyeb Dashboard
👉 https://app.koyeb.com/

### 3.2 Seleccionar tu servicio
1. Busca y haz clic en tu servicio **"uk-sabor-web"** (o el nombre que tenga)
2. Ve a la pestaña **"Settings"** (Configuración)

### 3.3 Actualizar Environment Variables
1. Busca la sección **"Environment variables"**
2. Encuentra estas dos variables y haz clic en **"Edit"** (lápiz):

   **Variable 1:**
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: Pega tu clave `sk_live_...` que copiaste en PASO 1.3

   **Variable 2:**
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Pega tu clave `whsec_...` que copiaste en PASO 2.3

3. Haz clic en **"Save"** o **"Update"**

### 3.4 Re-deploy automático
Koyeb detectará los cambios y hará un **re-deploy automático**.
Esto toma 2-3 minutos.

---

## ✅ PASO 4: Verificar que funciona

### 4.1 Esperar el deploy
- En Koyeb, verás el estado del deploy
- Espera a que diga **"Healthy"** o **"Running"** 🟢

### 4.2 Hacer una compra de prueba
1. Ve a https://www.consabor.uk/
2. Intenta comprar un curso, evento o clase
3. En el checkout de Stripe, usa esta tarjeta de prueba:
   ```
   Número: 4242 4242 4242 4242
   Fecha: 12/34 (cualquier fecha futura)
   CVC: 123 (cualquier 3 dígitos)
   ZIP: 12345 (cualquier código)
   ```

### 4.3 Verificar en Stripe
1. Ve a https://dashboard.stripe.com/
2. Asegúrate de estar en modo **"Production"** 🟢
3. Ve a **"Payments"** en el menú izquierdo
4. Deberías ver tu pago de prueba

✅ **Si ves el pago en Stripe Production, ¡funciona!**

---

## 🎉 ¡Listo!

Ya estás en modo LIVE. Ahora puedes:
- ✅ Recibir pagos reales
- ✅ El dinero irá a tu cuenta bancaria conectada a Stripe
- ✅ Los clientes pueden comprar eventos, cursos y clases

---

## 🆘 Si algo no funciona

1. **Verifica que estés en modo Production en Stripe** (esquina superior derecha)
2. **Verifica que las claves sean `sk_live_...` y `whsec_...`** (NO `sk_test_...`)
3. **Espera 3-5 minutos después de cambiar las variables en Koyeb**
4. **Revisa los logs en Koyeb** para ver si hay errores

---

## 📞 Comandos útiles

Para verificar en qué modo estás:
```bash
npx tsx scripts/check-stripe-mode.ts
```

Para ver el estado de la base de datos:
```bash
npx tsx scripts/database-overview.ts
```

---

**¡Éxito con tu lanzamiento! 🚀**
