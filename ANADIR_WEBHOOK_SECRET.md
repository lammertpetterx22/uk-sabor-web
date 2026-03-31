# Añadir STRIPE_WEBHOOK_SECRET a Koyeb

## 🎯 Objetivo
Configurar el secreto del webhook de Stripe para que los tickets aparezcan en el dashboard y se envíen los emails después de comprar.

---

## ⚡ OPCIÓN 1: Manual en Koyeb (1 minuto)

Esta es la forma más rápida y fácil.

### Pasos:

1. **Ve a Koyeb Dashboard**
   - Abre: https://app.koyeb.com/

2. **Selecciona tu servicio**
   - Click en tu app (uk-sabor-web o similar)

3. **Settings → Environment**
   - Click en "Settings" en el menú izquierdo
   - Click en pestaña "Environment"

4. **Añadir variable**
   - Click en "+ Add variable"
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_R57Ew5NYfFHhsE0Yk0XE1ImeeURn6cch`
   - Click "Add"

5. **Redeploy**
   - Click en "Redeploy" en la esquina superior derecha
   - Espera 2-3 minutos a que termine el deployment

6. **Verificar**
   - Compra un ticket de prueba
   - Verifica que aparece en el dashboard del usuario
   - Verifica que llegan los emails (QR + confirmación)

---

## ⚡ OPCIÓN 2: Script automático (requiere API token)

Si prefieres usar un script:

### 1. Obtén tu Koyeb API Token:
   - Ve a: https://app.koyeb.com/account/api
   - Click "Create API Token"
   - Copia el token

### 2. Ejecuta el script:
```bash
./scripts/add-stripe-webhook-secret.sh TU_KOYEB_API_TOKEN
```

### 3. Espera al redeploy:
   - Koyeb automáticamente redesplega
   - Espera 2-3 minutos

---

## 🔍 ¿Por qué es necesario?

### Problema actual:
- ✅ Webhook de Stripe está configurado
- ✅ Stripe envía eventos (6 delivered, 0 failed)
- ❌ El código no puede verificar que los eventos vienen de Stripe
- ❌ Por eso no procesa las compras (no añade tickets, no envía emails)

### Con STRIPE_WEBHOOK_SECRET:
- ✅ El código verifica que el evento viene de Stripe
- ✅ Procesa la compra correctamente
- ✅ Añade el ticket al dashboard del usuario
- ✅ Envía email con QR code
- ✅ Envía email de confirmación de orden

---

## 🧪 Cómo probar que funciona

Después de añadir el secreto y esperar al redeploy:

### 1. Compra un ticket:
   - Ve a: https://www.consabor.uk/events
   - Selecciona un evento
   - Compra con Stripe (modo test)

### 2. Verifica el dashboard:
   - Login en la cuenta del comprador
   - Ve a "My Tickets" o "Dashboard"
   - El ticket debería aparecer ✅

### 3. Verifica los emails:
   - Revisa el email del comprador
   - Deberías recibir 2 emails:
     1. **QR Code Email** 🎫 - Con código QR para check-in
     2. **Order Confirmation** 💳 - Confirmación de compra

### 4. Revisa los logs de Koyeb:
   - Deberías ver en los logs:
   ```
   [Webhook] checkout.session.completed
   [Webhook] QR code email sent to user@example.com
   [Webhook] Order confirmation email sent to user@example.com
   ```

---

## 📋 Resumen

**El secreto del webhook:**
```
whsec_R57Ew5NYfFHhsE0Yk0XE1ImeeURn6cch
```

**Añadir como variable de entorno en Koyeb:**
- Key: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_R57Ew5NYfFHhsE0Yk0XE1ImeeURn6cch`

**Después:**
- Redeploy
- Espera 2-3 minutos
- Prueba comprando un ticket
- ✅ Ticket aparece en dashboard
- ✅ Emails se envían

---

## ❓ Problemas?

Si después de añadir el secreto los tickets aún no aparecen:

1. **Verifica que se añadió correctamente:**
   - Koyeb → Settings → Environment
   - Busca `STRIPE_WEBHOOK_SECRET`

2. **Verifica que se redesplego:**
   - Koyeb → Deployments
   - El deployment más reciente debería ser después de añadir la variable

3. **Revisa los logs:**
   - Koyeb → Logs
   - Busca mensajes de `[Webhook]`
   - Deberías ver logs cuando compras un ticket

4. **Prueba el webhook directamente:**
   ```bash
   curl -X POST https://www.consabor.uk/api/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

---

¡Con esto los tickets deberían aparecer y los emails enviarse! 🚀
