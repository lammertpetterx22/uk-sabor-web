# 📧 Cómo Enviar Emails Masivos con Resend

## 🎯 ¿Qué Hace Este Script?

Envía un email personalizado a una lista de contactos que tú proporciones.

**Características:**
- ✅ Envía emails con HTML bonito
- ✅ Personaliza el nombre de cada persona
- ✅ Modo TEST para probar sin enviar emails reales
- ✅ Límites de seguridad (máximo 100 por ejecución)
- ✅ Delay entre emails (1 segundo) para no sobrecargar Resend
- ✅ Tracking de éxitos y fallos

---

## 📋 Pasos para Usar

### Paso 1: Prepara tu Lista de Contactos

Abre el archivo: **`scripts/send-bulk-emails.ts`**

Busca esta sección (línea ~79):

```typescript
const CONTACTS: Contact[] = [
  // EJEMPLO - Reemplaza con tus contactos reales:
  // { email: "usuario1@example.com", name: "Juan Pérez" },
  // { email: "usuario2@example.com", name: "María García" },
];
```

**Reemplaza con tu lista:**

```typescript
const CONTACTS: Contact[] = [
  { email: "persona1@example.com", name: "Juan Pérez" },
  { email: "persona2@example.com", name: "María García" },
  { email: "persona3@example.com", name: "Carlos López" },
  { email: "persona4@example.com", name: "Ana Martínez" },
  // ... añade todos los que necesites
];
```

**IMPORTANTE:**
- Cada contacto necesita `email` y `name`
- El `name` se usará para personalizar el email
- Puedes pegar cuantos contactos quieras

---

### Paso 2: Personaliza el Email

En el mismo archivo, busca `EMAIL_CONFIG` (línea ~12):

```typescript
const EMAIL_CONFIG = {
  from: "UK Sabor <noreply@consabor.uk>",
  subject: "🎉 ¡Bienvenido a UK Sabor!",  // ← Cambia esto

  htmlTemplate: (name: string) => `
    // ← Cambia el contenido del email aquí
  `
};
```

**Cambia:**
1. **Subject:** El asunto del email
2. **htmlTemplate:** El contenido HTML del email
3. **textTemplate:** La versión de texto plano

---

### Paso 3: Prueba en Modo TEST (MUY IMPORTANTE)

**SIEMPRE prueba primero en modo TEST.**

Busca `SAFETY_CONFIG` (línea ~89):

```typescript
const SAFETY_CONFIG = {
  testMode: true,  // ← DÉJALO en true para la primera prueba
  testEmails: ["petterlammert@gmail.com"],  // ← Cambia a TU email
};
```

**Cambia `testEmails` a tu email personal** para probar.

---

### Paso 4: Ejecuta en Modo TEST

Abre terminal y ejecuta:

```bash
npx tsx scripts/send-bulk-emails.ts
```

**Verás algo como:**

```
======================================================================
📨 ENVÍO MASIVO DE EMAILS - UK SABOR
======================================================================

⚠️  MODO TEST ACTIVADO
   No se enviarán emails reales.

📊 Resumen:
   Total de contactos: 50
   A procesar en esta ejecución: 1
   Subject: 🎉 ¡Bienvenido a UK Sabor!
   From: UK Sabor <noreply@consabor.uk>

======================================================================
🚀 INICIANDO ENVÍO...
======================================================================

[1/1]
📧 Enviando email a: petterlammert@gmail.com (Tu Nombre)
   ⚠️  TEST MODE - No se enviará email real
   Subject: 🎉 ¡Bienvenido a UK Sabor!
   From: UK Sabor <noreply@consabor.uk>

======================================================================
📊 RESUMEN FINAL
======================================================================
✅ Exitosos: 1
❌ Fallidos: 0
📧 Total procesados: 1

⚠️  MODO TEST - No se enviaron emails reales
```

**Esto NO envía emails reales**, solo simula.

---

### Paso 5: Revisa el Email

1. Abre el archivo `scripts/send-bulk-emails.ts`
2. Lee el `htmlTemplate` línea por línea
3. **Asegúrate que el contenido es correcto**
4. Verifica:
   - ✅ Ortografía
   - ✅ Links correctos
   - ✅ Información precisa
   - ✅ Llamado a la acción claro

---

### Paso 6: Enviar Email de Prueba REAL

Cuando estés seguro del contenido:

1. **Cambia `testMode` a `false`:**

```typescript
const SAFETY_CONFIG = {
  testMode: false,  // ← Cambia a false
  testEmails: ["tu-email@gmail.com"],  // Tu email para probar
  maxEmailsPerRun: 1,  // ← Solo 1 para la primera prueba real
};
```

2. **Agrega tu email en CONTACTS:**

```typescript
const CONTACTS: Contact[] = [
  { email: "tu-email@gmail.com", name: "Tu Nombre" },
  // ... otros contactos comentados por ahora
];
```

3. **Ejecuta:**

```bash
npx tsx scripts/send-bulk-emails.ts
```

4. **Verifica tu inbox:**
   - ✅ Recibiste el email
   - ✅ Se ve bien en móvil y desktop
   - ✅ Los links funcionan
   - ✅ El contenido es correcto

---

### Paso 7: Envío Masivo REAL

Cuando hayas probado y todo funcione:

1. **Agrega TODOS tus contactos:**

```typescript
const CONTACTS: Contact[] = [
  { email: "persona1@example.com", name: "Juan Pérez" },
  { email: "persona2@example.com", name: "María García" },
  { email: "persona3@example.com", name: "Carlos López" },
  // ... todos los contactos
];
```

2. **Configura el límite:**

```typescript
const SAFETY_CONFIG = {
  testMode: false,
  maxEmailsPerRun: 100,  // ← Máximo 100 por ejecución
  delayBetweenEmails: 1000,  // 1 segundo entre cada email
};
```

3. **Ejecuta:**

```bash
npx tsx scripts/send-bulk-emails.ts
```

4. **Espera confirmación:**

```
⚠️  ¡ATENCIÓN! Esto enviará emails REALES.
   Presiona Ctrl+C en los próximos 5 segundos para cancelar...
```

Si todo está bien, espera 5 segundos y comenzará el envío.

---

## 📊 Límites de Resend

**Plan Gratuito:**
- 100 emails por día
- 3,000 emails por mes

**Si tienes más de 100 contactos:**

1. Divide la lista en grupos de 100
2. Ejecuta el script una vez por día
3. O upgrade a plan Pro de Resend ($20/mes)

---

## 🎨 Personalizar el Email

### Cambiar el Asunto:

```typescript
subject: "🎉 ¡Nuevo evento en UK Sabor!",
```

### Cambiar el Contenido:

```typescript
htmlTemplate: (name: string) => `
  <!DOCTYPE html>
  <html>
    <body>
      <h1>Hola ${name}!</h1>
      <p>Tu contenido personalizado aquí...</p>
      <a href="https://www.consabor.uk/events">Ver Eventos</a>
    </body>
  </html>
`,
```

**IMPORTANTE:** Usa `${name}` para insertar el nombre del contacto.

---

## ⚠️ Seguridad y Mejores Prácticas

### ✅ HACER:

- Probar SIEMPRE en modo TEST primero
- Enviar email de prueba a ti mismo antes del envío masivo
- Verificar ortografía y links
- Incluir link de "unsubscribe" en el footer
- Respetar límites de Resend (100/día en plan gratuito)
- Usar delay entre emails (1 segundo)

### ❌ NO HACER:

- Enviar sin probar primero
- Enviar a emails que no dieron permiso (SPAM)
- Enviar más de 100/día en plan gratuito
- Quitar el delay entre emails (puede sobrecargar Resend)
- Usar emails con información falsa o engañosa

---

## 🐛 Troubleshooting

### Error: "RESEND_API_KEY no está configurado"

**Solución:**
1. Verifica que `.env` tiene: `RESEND_API_KEY=re_...`
2. Ejecuta desde la raíz del proyecto

### Error: "No hay contactos en la lista"

**Solución:**
Agrega contactos al array `CONTACTS` en el script.

### Error: "Daily sending quota exceeded"

**Solución:**
Has alcanzado el límite de 100 emails/día.
- Espera hasta mañana
- O upgrade a plan Pro

### Los emails van a spam

**Solución:**
1. Verifica que `consabor.uk` está verificado en Resend
2. No uses palabras spam en el subject ("GRATIS", "GANA DINERO", etc)
3. Incluye link de unsubscribe
4. Envía desde `noreply@consabor.uk`

---

## 📋 Checklist Antes de Envío Masivo

Antes de ejecutar con `testMode: false`:

- [ ] He probado en modo TEST
- [ ] He enviado email de prueba REAL a mi inbox
- [ ] He verificado el email en móvil y desktop
- [ ] Los links funcionan correctamente
- [ ] La ortografía es correcta
- [ ] El contenido es preciso
- [ ] Incluí link de unsubscribe
- [ ] Verifiqué el límite de Resend (100/día)
- [ ] La lista de CONTACTS es correcta
- [ ] El subject es apropiado

**Solo después de marcar TODO ✅ → Ejecuta el envío masivo.**

---

## 💡 Ejemplo de Lista de Contactos

Si tienes tu base de datos en Excel/CSV:

1. Abre Excel/CSV
2. Copia columna de emails
3. Copia columna de nombres
4. Formatea así:

```typescript
const CONTACTS: Contact[] = [
  { email: "juan@example.com", name: "Juan Pérez" },
  { email: "maria@example.com", name: "María García" },
  { email: "carlos@example.com", name: "Carlos López" },
  // ... pega todos
];
```

**TIP:** Usa búsqueda/reemplazo en tu editor para formatear rápido.

---

## 🚀 Resumen Rápido

```bash
# 1. Editar el script
nano scripts/send-bulk-emails.ts

# 2. Agregar CONTACTS y personalizar EMAIL_CONFIG

# 3. Probar en modo TEST
npx tsx scripts/send-bulk-emails.ts

# 4. Cambiar testMode a false y enviar prueba real a ti mismo

# 5. Verificar email recibido

# 6. Envío masivo
npx tsx scripts/send-bulk-emails.ts
```

---

¿Listo para empezar? 🚀

**Dame tu lista de contactos y te ayudo a formatearla correctamente.**
