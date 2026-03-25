# 🚀 Cambiar Stripe de Modo Test a Modo Producción

## 📋 Pasos para activar Stripe en modo LIVE

### 1️⃣ **Obtener las claves de producción de Stripe**

Ve a tu dashboard de Stripe: https://dashboard.stripe.com/

#### A. Activar tu cuenta de Stripe
1. Completa la información de tu negocio en Stripe
2. Verifica tu identidad si Stripe lo requiere
3. Configura los métodos de pago aceptados
4. **Activa el modo "Production"** (toggle en la parte superior derecha)

#### B. Copiar las claves de producción
1. Ve a **Developers → API Keys**
2. Asegúrate de estar en **modo "Production"** (NO test mode)
3. Copia tu **Secret key** (comienza con `sk_live_...`)
   - ⚠️ NUNCA compartas esta clave
   - ⚠️ NO la subas a GitHub

### 2️⃣ **Configurar el Webhook en modo producción**

1. Ve a **Developers → Webhooks** en Stripe
2. Asegúrate de estar en **modo "Production"**
3. Haz clic en **"Add endpoint"**
4. Configura:
   - **Endpoint URL**: `https://www.consabor.uk/api/stripe/webhook`
   - **Events to send**: Selecciona estos eventos:
     ```
     checkout.session.completed
     customer.subscription.created
     customer.subscription.updated
     customer.subscription.deleted
     invoice.payment_succeeded
     invoice.payment_failed
     payment_intent.succeeded
     payment_intent.payment_failed
     ```
5. Haz clic en **"Add endpoint"**
6. Copia el **Signing secret** (comienza con `whsec_...`)

### 3️⃣ **Actualizar las variables de entorno en Koyeb**

1. Ve a tu dashboard de Koyeb: https://app.koyeb.com/
2. Selecciona tu servicio **uk-sabor-web**
3. Ve a **Settings → Environment variables**
4. **Actualiza** estas dos variables:

   ```bash
   STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXX  # ← Tu clave LIVE (NO test)
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXX  # ← Tu webhook secret LIVE
   ```

5. Haz clic en **"Save"** o **"Update"**
6. Koyeb hará un **re-deploy automático** con las nuevas variables

### 4️⃣ **Verificar que todo funciona**

1. Espera 2-3 minutos a que Koyeb termine el deployment
2. Ve a https://www.consabor.uk/
3. Intenta comprar algo (usa una tarjeta real o de prueba)
4. **Tarjeta de prueba en modo producción**:
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos
   - ZIP: Cualquier código postal

5. Verifica en tu dashboard de Stripe que el pago aparece en **Production mode**

---

## ✅ Checklist de Seguridad

Antes de lanzar en producción, verifica:

- [ ] **Stripe está en modo "Production"** (NO test)
- [ ] Las claves `sk_live_...` y `whsec_...` están configuradas en Koyeb
- [ ] El webhook apunta a `https://www.consabor.uk/api/stripe/webhook`
- [ ] Los eventos del webhook están configurados correctamente
- [ ] Hiciste una compra de prueba y el webhook se activó correctamente
- [ ] Los pagos aparecen en el dashboard de Stripe (Production)
- [ ] Las confirmaciones por email se están enviando

---

## 🔍 Cómo verificar si estás en modo Test o Live

### En el código (backend):
El código **NO necesita cambios**. Automáticamente usa la clave que está en `STRIPE_SECRET_KEY`.

- Si la clave comienza con `sk_test_...` → Modo Test
- Si la clave comienza con `sk_live_...` → Modo Production

### En Stripe Dashboard:
Mira la esquina superior derecha:
- 🟠 **Test mode** → Estás en modo prueba
- 🟢 **Production** → Estás en modo real

---

## 💡 Diferencias entre Test y Production

| Característica | Test Mode | Production Mode |
|----------------|-----------|-----------------|
| **Pagos reales** | ❌ No | ✅ Sí |
| **Dinero en tu cuenta** | ❌ No | ✅ Sí |
| **Tarjetas de prueba** | ✅ Funcionan | ❌ No funcionan |
| **Tarjetas reales** | ❌ No funcionan | ✅ Funcionan |
| **Clave secreta** | `sk_test_...` | `sk_live_...` |
| **Webhook secret** | `whsec_test_...` | `whsec_...` |

---

## 🚨 Importante

1. **NUNCA** compartas tus claves `sk_live_...` públicamente
2. **NUNCA** las subas a GitHub (están en `.env` que está en `.gitignore`)
3. **SIEMPRE** usa las variables de entorno de Koyeb para producción
4. **Prueba** primero con una compra pequeña antes de lanzar oficialmente

---

## 📞 Soporte

Si tienes problemas:
- Revisa los logs de Koyeb: https://app.koyeb.com/
- Revisa el dashboard de Stripe: https://dashboard.stripe.com/
- Verifica que el webhook esté recibiendo eventos correctamente

---

**¡Listo!** Una vez que actualices las variables en Koyeb, tu tienda estará en modo producción y podrás recibir pagos reales. 🎉
