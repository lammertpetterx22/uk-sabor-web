# 📧 Resend Email Configuration - UK Sabor

Este documento explica cómo configurar Resend para enviar emails automáticos en UK Sabor.

## 🔑 API Key Actual

```
re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA
```

## 📝 Configuración en Koyeb

### 1. Variables de Entorno Necesarias

Agrega estas variables de entorno en Koyeb:

```bash
RESEND_API_KEY=re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA
RESEND_FROM_EMAIL=UK Sabor <noreply@consabor.uk>
```

### 2. Verificar Dominio en Resend

1. Ve a [Resend Dashboard](https://resend.com/domains)
2. Agrega el dominio: `consabor.uk`
3. Configura los registros DNS:
   - **SPF**: TXT record para autorización
   - **DKIM**: TXT record para autenticidad
   - **DMARC**: TXT record para política

**Importante:** Hasta que el dominio esté verificado, los emails se enviarán desde `onboarding@resend.dev` (solo para testing).

## ✉️ Emails Automáticos Implementados

### 1. **Email de Bienvenida** 🎉

Se envía cuando:
- Un usuario se registra con email/password
- Un usuario se registra via OAuth (Google, etc.)

**Contenido:**
- Saludo personalizado
- Bienvenida a UK Sabor
- Lista de features disponibles (eventos, clases, cursos, QR codes)
- Botón CTA: "Ver Próximos Eventos"
- Info de contacto

**Template:** `sendWelcomeEmail()` en `server/features/email.ts`

**Disparadores:**
- `server/features/custom-auth.ts` - Línea 88-95 (registro custom)
- `server/_core/oauth.ts` - Línea 40-48 (OAuth registration)

---

### 2. **Email de Confirmación de Compra** 💳

Se envía cuando:
- Un usuario completa una compra exitosa (ticket, curso, clase)

**Contenido:**
- Confirmación de pago
- Detalles de la orden (Order ID, item name, precio)
- Badge de "Confirmed"
- Nota: "Recibirás un email separado con tu QR code"

**Template:** `sendOrderConfirmationEmail()` en `server/features/email.ts`

**Disparadores:**
- `server/stripe/webhook.ts` - Webhook de Stripe
- `server/features/payments.ts` - Compras directas

---

### 3. **Email con QR Code** 🎫

Se envía cuando:
- Un usuario compra un ticket de evento
- Un usuario compra una clase

**Contenido:**
- QR code visual (imagen PNG)
- Código alfanumérico del ticket
- Detalles del evento/clase (nombre, fecha, hora)
- Instrucciones de uso del QR code
- Grid de "rule of thirds" en el QR

**Template:** `sendQRCodeEmail()` en `server/features/email.ts`

**Disparadores:**
- `server/stripe/webhook.ts` - Compras via carrito (multi-item)
- `server/stripe/webhook.ts` - Compras single-item
- `server/features/payments.ts` - Check-in en eventos

---

## 🛠️ Cómo Funciona

### Flujo de Registro:

```
Usuario se registra
    ↓
upsertUser() retorna { isNewUser: true }
    ↓
Se envía email de bienvenida (async)
    ↓
Usuario recibe email con features de UK Sabor
```

### Flujo de Compra:

```
Usuario completa pago en Stripe
    ↓
Webhook recibe checkout.session.completed
    ↓
Se crea orden + ticket/purchase en database
    ↓
Se genera QR code (PNG)
    ↓
Se envían 2 emails en paralelo:
    ├─> Email de confirmación de compra
    └─> Email con QR code + código de acceso
```

## 📂 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `server/features/email.ts` | Templates y funciones de envío |
| `server/features/custom-auth.ts` | Email de bienvenida (custom auth) |
| `server/_core/oauth.ts` | Email de bienvenida (OAuth) |
| `server/stripe/webhook.ts` | Emails de compras (webhook Stripe) |
| `server/features/payments.ts` | Emails de compras (direct) |
| `server/db.ts` | Función `upsertUser()` con detección de nuevo usuario |

## 🎨 Diseño de Emails

Todos los emails usan:
- **Gradiente UK Sabor**: `#ff1493` → `#ff8c00`
- **Tipografía**: System fonts (Apple San Francisco, Segoe UI, Roboto)
- **Responsive**: Mobile-first design
- **HTML + Plain Text**: Para compatibilidad con todos los clientes

### Características de Diseño:

✅ Headers con gradiente
✅ Emojis para mejor engagement
✅ CTAs prominentes
✅ Footer con info de contacto
✅ Versión plain-text para clientes sin HTML

## 🧪 Testing

### Modo de Desarrollo (Sin API Key):

Si `RESEND_API_KEY` no está configurada, los emails se loguean en consola:

```bash
[EMAIL] No RESEND_API_KEY configured - logging email instead:
[EMAIL] To: user@example.com
[EMAIL] From: UK Sabor <noreply@consabor.uk>
[EMAIL] Subject: 🎉 ¡Bienvenido a UK Sabor!
[EMAIL] Content preview: <!DOCTYPE html>...
```

### Modo de Producción (Con API Key):

```bash
[EMAIL] Sent successfully to user@example.com: 🎉 ¡Bienvenido a UK Sabor!
```

### Testing Manual:

1. **Email de Bienvenida:**
   - Registra un nuevo usuario en `/register`
   - Revisa tu email

2. **Email de Compra:**
   - Compra un ticket de evento
   - Revisa 2 emails:
     - Confirmación de compra
     - QR code con check-in

3. **Email OAuth:**
   - Inicia sesión por primera vez con Google
   - Revisa email de bienvenida

## ⚠️ Troubleshooting

### Email no llega

1. **Verifica API key:**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Revisa logs de Koyeb:**
   ```bash
   [EMAIL] Sent successfully to...
   ```
   O si falla:
   ```bash
   [EMAIL] Failed to send email: ...
   ```

3. **Verifica dominio en Resend:**
   - Dashboard → Domains → `consabor.uk` debe estar "Verified"

4. **Revisa spam:**
   - Hasta que el dominio esté verificado, emails pueden ir a spam

### Email llega pero con "via onboarding@resend.dev"

- **Solución:** Verifica el dominio `consabor.uk` en Resend
- Configura registros DNS (SPF, DKIM, DMARC)

### Email llega sin imágenes (QR codes)

- QR codes se generan como Data URLs (base64)
- Algunos clientes de email bloquean imágenes externas
- **Solución:** Incluimos también el código alfanumérico como backup

## 📊 Estadísticas en Resend

Puedes ver:
- Emails enviados
- Emails entregados
- Emails abiertos
- Emails con click
- Bounces y rechazos

Dashboard: https://resend.com/emails

## 🚀 Next Steps (Opcional)

### 1. Emails Personalizados Adicionales:

- **Recordatorio de evento** (24h antes)
- **Email de instructor aprobado**
- **Email de curso completado**
- **Newsletter mensual**

### 2. Templates Avanzados:

- Usar React Email para templates más complejos
- Sistema de plantillas reutilizables
- A/B testing de subject lines

### 3. Automatizaciones:

- Emails de carritos abandonados
- Re-engagement campaigns
- Emails de recompensas por fidelidad

## 📞 Soporte

- **Resend Docs:** https://resend.com/docs
- **Resend Support:** support@resend.com
- **UK Sabor Dev:** info@consabor.uk

---

✅ **Email system completamente implementado y listo para producción!**

Solo necesitas agregar la API key a Koyeb y opcionalmente verificar el dominio para emails con marca UK Sabor.
