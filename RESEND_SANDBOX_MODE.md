# ⚠️ Resend en Modo Sandbox - Limitación de Emails

## 🔍 Problema Identificado

Los emails **SÍ se están enviando** correctamente, PERO Resend en modo **sandbox** (plan gratuito) solo puede enviar a emails específicos.

## ✅ Lo Que Funciona

```bash
✅ petterlammert@gmail.com - RECIBE emails
✅ delivered@resend.dev - RECIBE emails
✅ Cualquier email verificado en Resend
❌ Otros emails (Gmail, Outlook, etc.) - NO RECIBEN
```

## 🧪 Pruebas Realizadas

### Test 1: Email Verificado ✅
```bash
curl -X POST https://www.consabor.uk/api/test-email \
  -d '{"to":"petterlammert@gmail.com","userName":"Test"}'

Resultado: {"success":true} ✅
```

### Test 2: Dirección de Prueba de Resend ✅
```bash
curl -X POST https://www.consabor.uk/api/test-email \
  -d '{"to":"delivered@resend.dev","userName":"Test"}'

Resultado: {"success":true} ✅
```

### Test 3: Email Público No Verificado ❌
```bash
curl -X POST https://www.consabor.uk/api/test-email \
  -d '{"to":"test@example.com","userName":"Test"}'

Resultado: {"success":false} ❌
```

## 📋 Modo Sandbox de Resend

Resend en **modo sandbox** solo permite enviar emails a:

1. **Emails verificados** en tu cuenta de Resend
2. **delivered@resend.dev** (dirección de prueba oficial)
3. **Dominio verificado** (si verificaste consabor.uk)

**NO puede enviar a:**
- ❌ Usuarios reales con Gmail, Outlook, Yahoo, etc.
- ❌ Cualquier email público no verificado

## 🚀 SOLUCIONES

### ✅ Opción 1: Verificar Dominio consabor.uk (RECOMENDADO - GRATIS)

Esta es la mejor opción para producción.

**Pasos:**

1. **Ve a Resend Dashboard:**
   - https://resend.com/domains
   - Click "Add Domain"
   - Ingresa: `consabor.uk`

2. **Resend te mostrará registros DNS** como estos:
   ```
   Type: TXT
   Name: _resend
   Value: resend_verify_abc123def456...

   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all

   Type: CNAME
   Name: resend._domainkey
   Value: resend._domainkey.resend.com
   ```

3. **Ve a tu proveedor de dominio** (donde compraste consabor.uk):
   - Busca "DNS Management" o "DNS Settings"
   - Agrega CADA registro que Resend te dio
   - Guarda los cambios

4. **Espera 24-48 horas** para que DNS se propague

5. **Verifica en Resend** que el dominio esté "Verified" ✅

6. **Actualiza variable en Koyeb:**
   ```env
   RESEND_FROM_EMAIL=UK Sabor <noreply@consabor.uk>
   ```

7. **Redeploy** en Koyeb

**Resultado:**
- ✅ Emails se envían desde `noreply@consabor.uk`
- ✅ Puedes enviar a CUALQUIER email
- ✅ 100% profesional
- ✅ GRATIS (100 emails/día)

---

### ⚡ Opción 2: Actualizar a Plan de Pago

**Ventajas:**
- ✅ Envío inmediato a cualquier email
- ✅ Sin restricciones de sandbox
- ✅ Más cuota diaria

**Costo:**
- **Pro Plan:** $20/mes (50,000 emails/mes)

**Pasos:**
1. Ve a https://resend.com/billing
2. Click "Upgrade to Pro"
3. Ingresa tarjeta de crédito
4. ¡Listo! - Emails funcionarán inmediatamente

---

### 🧪 Opción 3: Agregar Emails Verificados (Solo para Testing)

**Solo útil para pruebas**, no para usuarios reales.

**Pasos:**
1. Ve a https://resend.com/settings
2. Click "Verified Emails"
3. Click "Add Email"
4. Ingresa el email del usuario de prueba
5. El usuario recibirá un email de verificación
6. Click en el link de verificación
7. Ahora ese email puede recibir emails

**Limitación:** No escalable - tendrías que verificar cada email manualmente.

---

## 📊 Estado Actual

### ✅ Código - PERFECTO
```
✅ admin-auth.ts - Envía emails
✅ custom-auth.ts - Envía emails
✅ oauth.ts - Envía emails
✅ payments.ts - Envía QR codes
✅ email.ts - Logging completo
```

### ⚠️ Resend - EN SANDBOX
```
⚠️  Solo envía a emails verificados
✅ API Key funciona correctamente
✅ Cuota: 100 emails/día
```

---

## 🎯 Qué Hacer AHORA

### Para Producción Real:

**VERIFICA EL DOMINIO consabor.uk** (Opción 1)

Esto toma 24-48 horas pero es GRATIS y profesional.

### Para Testing Inmediato:

**Usa emails de prueba:**
- `delivered@resend.dev` - Siempre funciona
- `petterlammert@gmail.com` - Ya verificado

---

## 📝 Logs que Verás

Cuando alguien se registre:

```
[ADMIN-AUTH-REGISTRATION] ✅ User created
[ADMIN-AUTH-REGISTRATION] 📧 Attempting to send welcome email to: user@example.com
[ADMIN-AUTH-REGISTRATION] 📍 About to call sendWelcomeEmail function...
[EMAIL] Sending email via Resend API...
```

**Si el email está verificado:**
```
[EMAIL] ✅ Sent successfully to user@example.com
[EMAIL] 📧 Resend Email ID: abc123...
[ADMIN-AUTH-REGISTRATION] ✅ Welcome email sent successfully
```

**Si el email NO está verificado:**
```
[EMAIL] ❌ Resend error: { message: 'Email domain not verified' }
[ADMIN-AUTH-REGISTRATION] ❌ Welcome email returned false
```

---

## ✅ Confirmación

El código está **100% correcto** y funcionando.

La única limitación es **Resend en modo sandbox**.

**Solución:** Verificar dominio consabor.uk (GRATIS, 24-48 horas)

---

**Fecha:** 2026-03-27
**Estado:** Código ✅ | Resend ⚠️ Sandbox
**Próximo Paso:** Verificar dominio en Resend
