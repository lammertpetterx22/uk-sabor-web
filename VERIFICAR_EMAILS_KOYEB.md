# ⚠️ Verificar Configuración de Emails en Koyeb

## Problema Reportado

Usuario se registró pero NO recibió email de bienvenida.

## Causa Más Probable

La variable `RESEND_API_KEY` probablemente NO está configurada en Koyeb, o el deployment no se reinició después de añadirla.

---

## ✅ Cómo Verificar en Koyeb Dashboard

### Paso 1: Ir a Variables de Entorno

1. Ve a https://app.koyeb.com/
2. Click en tu app: `uk-sabor-web`
3. Click en el servicio: `uk-sabor-web`
4. Click en la pestaña "Settings" (Configuración)
5. Scroll down hasta "Environment variables" (Variables de entorno)

### Paso 2: Verificar que Estas Variables Existen

Busca estas dos variables:

```
✅ RESEND_API_KEY = re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA
✅ RESEND_FROM_EMAIL = UK Sabor <onboarding@resend.dev> (opcional)
```

**Si NO están configuradas:**

1. Click en "+ Add variable"
2. Añade:
   - Name: `RESEND_API_KEY`
   - Value: `re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA`
3. Click "Save"
4. Click en "+ Add variable" otra vez
5. Añade:
   - Name: `RESEND_FROM_EMAIL`
   - Value: `UK Sabor <onboarding@resend.dev>`
6. Click "Save"

### Paso 3: Redeploy (MUY IMPORTANTE!)

**Koyeb necesita reiniciar para cargar las nuevas variables!**

1. Click en "Redeploy" en la parte superior
2. Espera 2-3 minutos mientras se reinicia
3. Verifica que el deployment dice "Healthy" (verde)

---

## 🧪 Cómo Probar Después de Configurar

### Opción 1: Registrar Nueva Cuenta

1. Ve a https://www.consabor.uk/register
2. Crea una cuenta nueva con tu email
3. Chequea tu inbox (y spam)
4. Deberías recibir: **"🎉 Welcome to UK Sabor!"**

### Opción 2: Ver Logs en Tiempo Real

1. En Koyeb, ve a la pestaña "Logs"
2. Click en "Live logs" (logs en vivo)
3. Registra una cuenta nueva
4. Deberías ver en los logs:

```
[REGISTRATION] ✅ User created: { email: 'test@example.com', hasResendKey: true }
[REGISTRATION] 📧 Attempting to send welcome email to: test@example.com
[REGISTRATION] 🔑 RESEND_API_KEY present: true
[EMAIL] ✅ Resend client found - attempting to send email
[EMAIL] Sent successfully to test@example.com: 🎉 Welcome to UK Sabor!
[REGISTRATION] ✅ Welcome email sent successfully to: test@example.com
```

**Si ves esto en los logs:**
```
[REGISTRATION] 🔑 RESEND_API_KEY present: false
[EMAIL] ❌ No RESEND_API_KEY configured - logging email instead
```

**Significa que la variable NO está configurada o el deployment no se reinició!**

---

## 🔍 Diagnóstico de Problemas

### Problema 1: Variable configurada pero hasResendKey: false

**Causa:** Deployment no se reinició después de añadir la variable

**Solución:**
1. Click "Redeploy" en Koyeb
2. Espera 2-3 minutos
3. Prueba de nuevo

### Problema 2: Email se envía pero no llega

**Causa:** Email va a spam o problemas con Resend

**Solución:**
1. Revisa carpeta de spam
2. Espera 5 minutos (a veces tarda)
3. Añade `onboarding@resend.dev` a contactos

### Problema 3: Logs muestran error de Resend

**Posibles errores:**

```javascript
// Error: Domain no verificado
{ statusCode: 403, message: 'The consabor.uk domain is not verified' }
Solución: Ya está arreglado usando onboarding@resend.dev

// Error: API key inválida
{ statusCode: 401, message: 'Invalid API key' }
Solución: Verifica que la API key sea exactamente: re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA
```

---

## 📧 Tipos de Emails que se Envían

### 1. Email de Bienvenida (Registration)
- **Cuándo:** Usuario se registra (custom auth o Google OAuth)
- **Asunto:** "🎉 Welcome to UK Sabor!"
- **Contenido:** Fondo negro, features, CTA a eventos

### 2. Email de Confirmación de Compra
- **Cuándo:** Usuario compra ticket/curso/clase
- **Asunto:** "Order Confirmed - [Item Name] | UK Sabor"
- **Contenido:** Detalles del pedido, total pagado

### 3. Email con Código QR
- **Cuándo:** Usuario compra ticket de evento o clase
- **Asunto:** "Your Event Ticket - [Event Name]"
- **Contenido:** QR code visual + código alfanumérico

---

## ✅ Checklist de Verificación

- [ ] Variable `RESEND_API_KEY` existe en Koyeb
- [ ] Valor es exactamente: `re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA`
- [ ] Variable `RESEND_FROM_EMAIL` existe (opcional)
- [ ] Deployment se reinició después de añadir variables
- [ ] Status es "Healthy" (verde) en Koyeb
- [ ] Logs muestran: `hasResendKey: true`
- [ ] Logs muestran: `Email sent successfully`
- [ ] Email llegó a inbox (o spam)

---

## 🚨 Si Sigue Sin Funcionar

1. Captura screenshot de las variables en Koyeb
2. Captura screenshot de los logs cuando te registras
3. Verifica que el email no esté en spam
4. Revisa que el deployment esté en "Healthy"

**El problema más común es que falta RESEND_API_KEY en Koyeb o que no se hizo redeploy después de añadirla.**
