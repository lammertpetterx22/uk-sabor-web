# 💸 Sistema de Payouts - Guía Completa

## 🎯 Cómo Funciona

El sistema permite que instructores/promotores retiren sus ganancias de forma segura, con aprobación y verificación manual del admin.

---

## 📋 Flujo Completo

### **Paso 1: Instructor Añade Datos Bancarios**

1. Instructor va a su Dashboard → Settings → Bank Details
2. Llena el formulario:
   - Account Holder Name: "John Smith"
   - Sort Code: "12-34-56"
   - Account Number: "12345678"
3. Click "Save"
4. ✅ Datos guardados **encriptados** en la base de datos

**Seguridad:**
- Sort Code y Account Number se guardan encriptados (AES-256)
- Solo admins pueden desencriptarlos
- Instructor solo ve datos enmascarados: `**-**-56` y `****5678`

---

### **Paso 2: Instructor Pide Withdrawal**

1. Instructor va a Earnings → Request Withdrawal
2. Introduce cantidad: £50.00
3. Click "Request Withdrawal"
4. ✅ Request creado con status: `pending`
5. Dinero se descuenta de su balance disponible (queda "en proceso")

**Validación:**
- Solo puede retirar hasta su balance disponible
- Mínimo: £1.00
- Balance se congela hasta que admin apruebe/rechace

---

### **Paso 3: Admin Aprueba y Ve Datos Bancarios**

**Admin va a:** Admin Dashboard → Withdrawals

1. Ve lista de todos los withdrawal requests `pending`
2. Click en un request para ver detalles:
   - Usuario: John Smith (john@example.com)
   - Cantidad: £50.00
   - Requested At: 27 Mar 2026, 10:30 AM
   - Status: Pending

3. Click "Approve" → Se abren los **datos bancarios desencriptados**:
   ```
   Account Holder: John Smith
   Sort Code: 12-34-56
   Account Number: 12345678
   Amount: £50.00
   ```

4. Admin copia estos datos para hacer la transferencia bancaria

---

### **Paso 4: Admin Hace Transferencia Manual**

**Admin va a su banco** (Barclays, HSBC, Lloyds, etc.):

1. Inicia transferencia bancaria:
   - **Payee Name:** John Smith
   - **Sort Code:** 12-34-56
   - **Account Number:** 12345678
   - **Amount:** £50.00
   - **Reference:** SABOR-PAYOUT-123

2. Completa la transferencia

3. **Descarga el comprobante** (screenshot o PDF del banco)

---

### **Paso 5: Admin Sube Comprobante y Completa Payout**

De vuelta en UK Sabor Admin Dashboard:

1. Click "Upload Proof" en el withdrawal request
2. Arrastra/selecciona el comprobante bancario (PNG, JPG, PDF)
3. (Opcional) Añade notas: "Paid via Barclays on 27/03/2026"
4. Click "Complete Payout"

**El sistema automáticamente:**
- ✅ Marca withdrawal como `paid`
- ✅ Guarda URL del comprobante
- ✅ Actualiza balance del instructor (`totalWithdrawn`)
- ✅ Finaliza transacción en el ledger
- ✅ **Envía email al instructor** con confirmación

---

### **Paso 6: Instructor Recibe Confirmación**

**Email automático enviado:**

```
Subject: 💸 Payout Completed - £50.00 | UK Sabor

Hi John,

Great news! Your withdrawal request has been processed and the money
has been transferred to your bank account.

Amount Transferred: £50.00
Request ID: #123
Status: ✅ Paid
Expected Arrival: 1-3 business days

View Dashboard
```

**En el dashboard del instructor:**
- Balance actualizado
- Withdrawal marcado como "Paid"
- Puede ver el comprobante si lo desea

---

## 🔐 Seguridad Implementada

### **Encriptación de Datos Bancarios**

```typescript
// Encryption key (32 bytes, stored in environment)
BANK_ENCRYPTION_KEY=64_caracteres_hex_random

// Datos guardados así:
bankSortCode: "iv:encrypted_data:auth_tag"
bankAccountNumber: "iv:encrypted_data:auth_tag"
```

**Algoritmo:** AES-256-GCM (military-grade encryption)

**Permisos:**
- ❌ Instructores NO pueden ver sus propios datos desencriptados
- ✅ Solo ADMINS pueden desencriptar cuando aprueban payouts
- ✅ Nadie más tiene acceso

### **Validación de Datos**

```typescript
Sort Code: /^\d{2}-\d{2}-\d{2}$/ (XX-XX-XX)
Account Number: /^\d{8}$/ (8 digits)
```

---

## 📊 Estados de Withdrawal

| Estado | Descripción | Siguiente Paso |
|--------|-------------|----------------|
| `pending` | Instructor pidió withdrawal | Admin aprueba/rechaza |
| `approved` | Admin aprobó, listo para pagar | Admin hace transferencia |
| `paid` | Transferencia completada y comprobante subido | ✅ Finalizado |
| `rejected` | Admin rechazó | Dinero devuelto al instructor |

---

## 🛠️ Configuración Inicial

### **1. Generar Encryption Key**

```bash
# Genera una key aleatoria (hacer UNA VEZ)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output (ejemplo):
# a1b2c3d4e5f6...  (64 caracteres)
```

### **2. Añadir a Koyeb**

En Koyeb Dashboard → Settings → Environment Variables:

```
BANK_ENCRYPTION_KEY=a1b2c3d4e5f6... (el output del paso anterior)
```

⚠️ **MUY IMPORTANTE:**
- Guarda esta key en un lugar seguro (1Password, Bitwarden, etc.)
- Si pierdes la key, NO podrás desencriptar datos bancarios existentes
- Nunca compartas esta key públicamente

### **3. Ejecutar Migraciones**

```bash
# En producción (Koyeb), ejecuta:
psql $DATABASE_URL < server/migrations/add-bank-details.sql

# O ejecuta manualmente:
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankAccountHolderName" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankSortCode" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankDetailsVerified" BOOLEAN DEFAULT false;
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
```

---

## 🎨 UI/UX para Instructores

### **Bank Details Form**
- Validación en tiempo real
- Formato automático (12-34-56)
- Muestra datos enmascarados después de guardar
- Badge "Verified" / "Pending Verification"

### **Withdrawal Request**
- Muestra balance disponible
- Validación de mínimo/máximo
- Estimación de llegada (1-3 días)
- Historial de withdrawals

---

## 🎨 UI/UX para Admin

### **Withdrawals Dashboard**
- Lista de todos los requests (pending primero)
- Filtros: Status, Date, User
- Quick Actions: Approve, Reject, View Details

### **Approval Flow**
1. Click "View Details" → Modal con:
   - User info
   - Amount
   - Bank details (desencriptados)
   - Copy buttons para datos bancarios
2. Click "I've Transferred" → Upload proof
3. Upload proof → Drag & drop
4. Complete → Email automático enviado

---

## 📧 Emails Enviados

### **Para Instructor:**
1. **Withdrawal Request Created** (opcional)
   - Confirma que el request fue creado
   - Tiempo estimado de procesamiento

2. **Payout Completed** (SIEMPRE)
   - Confirmación de transferencia
   - Cantidad pagada
   - Fecha estimada de llegada
   - Link al comprobante (opcional)

### **Para Admin:**
(Opcional - puedes añadir notificaciones)
- Notificación cuando hay nuevo withdrawal request

---

## 💰 Costos

- **Encriptación:** £0.00 (incluido en el sistema)
- **Transferencia bancaria UK:** £0.00 - £0.50 (depende de tu banco)
- **Stripe Payouts API:** N/A (no se usa, haces transferencias manuales)

**Total por payout:** ~£0.00 - £0.50

---

## ⚡ Próximos Pasos Opcionales

### **Automatización Futura (Wise API)**

Si quieres hacer las transferencias 100% automáticas en el futuro:

1. Crear cuenta Wise Business
2. Usar Wise API para transferencias automáticas
3. Costo: ~£0.30-0.50 por transferencia
4. Sin necesidad de subir comprobantes (Wise lo hace automático)

### **Verificación Bancaria**

Puedes añadir un paso de verificación antes del primer payout:
- Admin marca bank details como "verified" después de revisar
- Solo permite payouts a cuentas verificadas
- Reduce riesgo de errores en datos bancarios

---

## 🐛 Troubleshooting

### **Error: "BANK_ENCRYPTION_KEY not found"**
**Solución:** Añade la variable de entorno en Koyeb

### **Error: "Failed to decrypt"**
**Causa:** Encryption key cambió o datos corruptos
**Solución:** El instructor debe re-añadir sus datos bancarios

### **Email no se envió**
**Solución:** Verifica que `RESEND_API_KEY` esté configurado

### **Comprobante no se sube**
**Solución:** Verifica que Bunny CDN esté configurado correctamente

---

## ✅ Checklist de Implementación

- [ ] Generar BANK_ENCRYPTION_KEY
- [ ] Añadir key a Koyeb environment
- [ ] Ejecutar migraciones SQL
- [ ] Probar añadir bank details como instructor
- [ ] Probar crear withdrawal request
- [ ] Probar aprobar y ver datos desencriptados como admin
- [ ] Hacer transferencia bancaria de prueba
- [ ] Subir comprobante y completar payout
- [ ] Verificar que email de confirmación llegó

---

¡Listo! El sistema está completamente funcional y seguro. 🎉
