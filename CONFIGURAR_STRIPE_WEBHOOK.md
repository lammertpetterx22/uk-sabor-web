# 🔧 Configurar Stripe Webhook - URGENTE

## ⚠️ PROBLEMA

Cuando compras tickets:
- ❌ NO aparecen en el dashboard del usuario
- ❌ NO se envía email con QR code
- ❌ NO se envía confirmación de compra

**CAUSA:** El webhook de Stripe NO está configurado.

---

## ✅ SOLUCIÓN (5 MINUTOS)

### Paso 1: Ve a Stripe Dashboard

1. Abre: https://dashboard.stripe.com/webhooks
2. Login con tu cuenta de Stripe
3. **Asegúrate de estar en modo "Test" o "Live"** según corresponda

### Paso 2: Agregar Webhook

1. Click en **"Add endpoint"** o **"+ Add an endpoint"**

2. **Endpoint URL:** Copia y pega EXACTAMENTE esto:
   ```
   https://www.consabor.uk/api/stripe/webhook
   ```

3. **Description:** (opcional)
   ```
   UK Sabor - Production Webhook
   ```

4. **Events to send:** Click en "Select events"
   - Busca: `checkout.session.completed`
   - ✅ Marca ese evento
   - Click "Add events"

5. Click **"Add endpoint"**

### Paso 3: Copiar el Signing Secret

Después de crear el webhook, Stripe te mostrará algo como:

```
Signing secret
whsec_abc123def456...
```

1. Click en **"Reveal"** o el botón para ver el secreto
2. Click en **"Copy"** para copiarlo
3. **Guárdalo** - lo necesitarás en el siguiente paso

### Paso 4: Agregar Secret a Koyeb

1. Ve a: https://app.koyeb.com/
2. Selecciona tu aplicación
3. Click **"Settings"** → **"Environment"**
4. Busca si existe `STRIPE_WEBHOOK_SECRET`

**Si NO existe:**
- Click "Add variable"
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_abc123def456...` (el que copiaste)
- Click "Add"

**Si SÍ existe:**
- Click en "Edit" (lápiz)
- Reemplaza el valor con el nuevo secreto
- Click "Save"

5. Click **"Redeploy"**
6. Espera 2-3 minutos

---

## 🧪 PROBAR QUE FUNCIONA

### Paso 1: Compra un Ticket de Prueba

1. Ve a https://www.consabor.uk/events
2. Selecciona un evento
3. Compra un ticket (usa tarjeta de prueba de Stripe)

**Tarjeta de prueba:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier fecha futura (ej: 12/25)
- CVC: Cualquier 3 dígitos (ej: 123)

### Paso 2: Verifica que Funcionó

**✅ Deberías recibir 2 EMAILS:**
1. Email con QR code para check-in
2. Email de confirmación de compra con PDF

**✅ El ticket debería aparecer:**
- Dashboard del usuario → Sección "My Tickets"

**✅ En Stripe Dashboard:**
- https://dashboard.stripe.com/webhooks
- Click en tu webhook
- Deberías ver eventos "Succeeded" en verde

---

## 📊 Si Sigue Sin Funcionar

### Verifica los Logs de Stripe

1. Ve a: https://dashboard.stripe.com/webhooks
2. Click en tu webhook endpoint
3. Ve a la tab "Logs"
4. Busca errores en rojo

**Errores comunes:**
- ❌ `401 Unauthorized` → El STRIPE_WEBHOOK_SECRET está mal
- ❌ `404 Not Found` → La URL del webhook está mal
- ❌ `500 Server Error` → Hay un error en el código (revisa logs de Koyeb)

### Verifica los Logs de Koyeb

1. Ve a: https://app.koyeb.com/
2. Tu aplicación → "Logs"
3. Busca mensajes:
   ```
   [Webhook] Received event: checkout.session.completed
   [Webhook] Processed event purchase for user X
   [Webhook] QR code email sent to...
   ```

---

## ⚡ RESUMEN RÁPIDO

1. **Stripe Dashboard** → Webhooks → Add endpoint
   - URL: `https://www.consabor.uk/api/stripe/webhook`
   - Event: `checkout.session.completed`

2. **Copiar** el Signing Secret (whsec_...)

3. **Koyeb** → Settings → Environment
   - Variable: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_abc123...`
   - Redeploy

4. **Probar** comprando un ticket

---

## 🎯 RESULTADO ESPERADO

Después de configurar esto:

✅ Usuario compra ticket → Stripe procesa pago
✅ Stripe llama al webhook → `https://www.consabor.uk/api/stripe/webhook`
✅ Webhook crea el ticket en la base de datos
✅ Webhook genera QR code
✅ Webhook envía 2 emails:
   - Email con QR code
   - Email de confirmación con PDF
✅ Ticket aparece en dashboard del usuario

---

**¡HAZLO AHORA! Son solo 5 minutos y todo funcionará.** 🚀

Si tienes algún error, copia el mensaje de error y dime exactamente qué dice.
