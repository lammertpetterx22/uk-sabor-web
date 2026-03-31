# 🎫 Probar Sistema de Compra de Tickets

## ✅ CONFIGURACIÓN COMPLETA

Todo está configurado correctamente en Koyeb:
- ✅ RESEND_API_KEY (emails)
- ✅ RESEND_FROM_EMAIL (noreply@consabor.uk - dominio verificado)
- ✅ STRIPE_SECRET_KEY (pagos)
- ✅ STRIPE_WEBHOOK_SECRET (webhook configurado)

---

## 🧪 PRUEBA COMPLETA DEL FLUJO

### Paso 1: Comprar un ticket

1. **Ve a la página de eventos:**
   - https://www.consabor.uk/events

2. **Selecciona un evento:**
   - Click en cualquier evento disponible

3. **Compra un ticket:**
   - Click "Buy Ticket" o "Comprar"
   - Completa el checkout de Stripe

   **IMPORTANTE:** Usa una tarjeta de prueba de Stripe:
   ```
   Número: 4242 4242 4242 4242
   Fecha: Cualquier fecha futura (ej: 12/25)
   CVC: Cualquier 3 dígitos (ej: 123)
   ```

4. **Completa la compra:**
   - Click "Pay"
   - Espera a que se procese

---

### Paso 2: Verificar que el ticket aparece

1. **Ve al dashboard del usuario:**
   - Login con la cuenta que compró
   - Ve a "My Tickets" o "Dashboard"

2. **Debería aparecer:**
   - ✅ El ticket del evento comprado
   - ✅ Con código QR
   - ✅ Con detalles del evento

---

### Paso 3: Verificar emails

Revisa el email de la cuenta que compró. Deberías recibir **2 emails**:

1. **Email con QR Code** 🎫
   - Asunto: "Tu entrada para [nombre del evento]"
   - Contenido: Código QR, nombre del evento, fecha/hora
   - De: UK Sabor <noreply@consabor.uk>

2. **Email de confirmación de orden** 💳
   - Asunto: "Confirmación de compra #[número]"
   - Contenido: Detalles de la compra, monto, invoice PDF
   - De: UK Sabor <noreply@consabor.uk>

**NOTA:** Revisa también la carpeta de spam/junk por si acaso.

---

### Paso 4: Verificar logs en Koyeb

1. **Ve a Koyeb Dashboard:**
   - https://app.koyeb.com/

2. **Selecciona tu app → Logs**

3. **Busca estos mensajes** (después de comprar):
   ```
   [Webhook] Received event: checkout.session.completed
   [Webhook] Session ID: cs_...
   [Webhook] Processing completed checkout session
   [Webhook] QR code email sent to user@example.com for event 123
   [Webhook] Order confirmation email sent to user@example.com for order 456
   ```

4. **Si ves estos logs:**
   - ✅ El webhook está funcionando correctamente
   - ✅ Los emails se enviaron
   - ✅ El ticket se creó

---

## 🔍 Verificar Stripe Dashboard

1. **Ve a Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks

2. **Click en tu webhook:**
   - `https://www.consabor.uk/api/stripe/webhook`

3. **Deberías ver:**
   - ✅ Eventos entregados (delivered) aumentando
   - ✅ 0 errores (failed)
   - ✅ Status 200 OK en los eventos recientes

4. **Si ves errores:**
   - Click en el evento fallido
   - Revisa el error message
   - Puede ser que STRIPE_WEBHOOK_SECRET sea incorrecto

---

## 🐛 Problemas comunes

### Problema 1: Ticket no aparece en dashboard
**Posibles causas:**
- Webhook no está procesando correctamente
- Error en el código del webhook
- STRIPE_WEBHOOK_SECRET incorrecto

**Solución:**
1. Revisa logs de Koyeb para ver errores
2. Verifica en Stripe Dashboard si el webhook está fallando
3. Si falla con "signature verification", el STRIPE_WEBHOOK_SECRET es incorrecto

---

### Problema 2: Emails no llegan
**Posibles causas:**
- Emails van a spam
- Resend alcanzó el límite (100/día en free tier)
- Error en el código de envío de emails

**Solución:**
1. Revisa carpeta de spam/junk
2. Revisa logs de Koyeb para ver si dice "Email sent successfully"
3. Ve a Resend Dashboard: https://resend.com/emails
4. Busca los emails por fecha/hora de compra
5. Revisa el status (delivered, bounced, spam, etc.)

---

### Problema 3: Webhook falla con error 400
**Error típico:**
```
Webhook Error: No signatures found matching the expected signature for payload
```

**Causa:** STRIPE_WEBHOOK_SECRET es incorrecto

**Solución:**
1. Ve a Stripe Dashboard → Webhooks
2. Click en tu webhook
3. Click "Signing secret" → "Reveal"
4. Copia el secreto (empieza con `whsec_...`)
5. Ve a Koyeb → Settings → Environment
6. Edita STRIPE_WEBHOOK_SECRET con el nuevo valor
7. Redeploy

---

## ✅ Checklist de verificación

Después de la compra de prueba:

- [ ] Pago procesado correctamente en Stripe
- [ ] Ticket aparece en dashboard del usuario
- [ ] Email con QR code recibido
- [ ] Email de confirmación recibido
- [ ] Logs en Koyeb muestran webhook procesado
- [ ] Stripe Dashboard muestra webhook entregado (200 OK)

**Si todas están ✅ → ¡Sistema funcionando perfectamente!** 🎉

**Si alguna está ❌ → Revisa la sección de problemas comunes arriba**

---

## 📊 Resend Dashboard - Verificar emails

1. **Ve a Resend Dashboard:**
   - https://resend.com/emails

2. **Filtra por fecha:**
   - Selecciona "Today" o la fecha de la compra

3. **Busca los emails:**
   - Deberías ver 2 emails enviados después de la compra
   - Email 1: QR code (asunto con nombre del evento)
   - Email 2: Order confirmation (asunto con número de orden)

4. **Click en cada email para ver:**
   - Status: Delivered / Bounced / Spam
   - To: Email del comprador
   - Subject: Asunto del email
   - Logs: Detalles de entrega

---

## 🎯 Resultado esperado

### ✅ Flujo completo exitoso:

1. Usuario compra ticket → Pago en Stripe
2. Stripe envía webhook → Koyeb recibe evento
3. Webhook verificado con STRIPE_WEBHOOK_SECRET → Procesa compra
4. Ticket creado en base de datos → Aparece en dashboard
5. QR code generado → Email 1 enviado
6. Invoice PDF generado → Email 2 enviado
7. Usuario recibe 2 emails y ve ticket en dashboard

### ✅ Logs esperados en Koyeb:

```
[Webhook] Received event: checkout.session.completed
[Webhook] Session ID: cs_test_...
[Webhook] Processing completed checkout session
[Webhook] User email: user@example.com
[Webhook] Item type: event
[Webhook] Item ID: 123
[Webhook] Creating ticket entry...
[Webhook] Ticket created successfully
[Webhook] Generating QR code...
[Webhook] QR code generated
[EMAIL] Sending email via Resend API...
[EMAIL] ✅ Sent successfully to user@example.com: 🎫 Tu entrada para [evento]
[EMAIL] 📧 Resend Email ID: abc123...
[Webhook] QR code email sent to user@example.com for event 123
[EMAIL] Sending email via Resend API...
[EMAIL] ✅ Sent successfully to user@example.com: 💳 Confirmación de compra
[EMAIL] 📧 Resend Email ID: def456...
[Webhook] Order confirmation email sent to user@example.com for order 789
```

---

¡Prueba ahora y verifica que todo funcione! 🚀
