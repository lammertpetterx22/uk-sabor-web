# ✅ Sistema de Withdrawals Simplificado

## 🎯 Flujo Completo Implementado

### **Paso 1: Instructor Pide Withdrawal**

El instructor va a su página de **Earnings** y:

1. Click en botón **"Request Withdrawal"**
2. Ve un modal con su balance disponible
3. Introduce la cantidad a retirar
4. **NUEVO:** Llena el formulario de datos bancarios:
   - **Account Holder Name:** Nombre completo (ej: "John Smith")
   - **Sort Code:** XX-XX-XX (6 dígitos)
   - **Account Number:** 8 dígitos
5. Click **"Confirm Withdrawal"**

✅ El sistema:
- Valida los datos bancarios (formato UK)
- Congela la cantidad del balance
- Crea withdrawal request con estado `pending`
- Guarda los datos bancarios **en el request** (NO en tabla users)

---

### **Paso 2: Tú (Admin) Ves el Request**

Vas a **Admin Dashboard → Withdrawals** y:

1. Ves lista de pending withdrawals
2. Click en un request → Se abre modal
3. **NUEVO:** El modal muestra tarjeta con datos bancarios:
   ```
   ┌─────────────────────────────────────┐
   │ 💳 Bank Account Details            │
   ├─────────────────────────────────────┤
   │ Account Holder: John Smith         │
   │ Sort Code:      12-34-56           │
   │ Account Number: 12345678           │
   └─────────────────────────────────────┘
   ```
4. Lees la instrucción: "Transfer £50.00 to this account via your bank"

---

### **Paso 3: Haces la Transferencia Manual**

1. Abres tu banca online / app bancaria
2. Creas nueva transferencia:
   - **Beneficiary:** John Smith (copias del modal)
   - **Sort Code:** 12-34-56
   - **Account Number:** 12345678
   - **Amount:** £50.00
   - **Reference:** "UK Sabor Withdrawal"
3. Envías la transferencia
4. Esperas confirmación del banco (1-5 minutos)

---

### **Paso 4: Marcas como Paid en Admin**

De vuelta en el modal de Admin:

1. (Opcional) Escribes notas administrativas
2. Click botón **"Mark as Paid"** (verde)

✅ El sistema:
- Actualiza status del request a `paid`
- Actualiza `totalWithdrawn` del instructor
- Marca ledger transaction como `completed`
- El instructor ve el withdrawal como **PAID** en su dashboard

---

## 📋 Datos Que Se Guardan

### **En `withdrawalRequests` table:**
```
id: 123
userId: 456
amount: 50.00
status: pending → paid
accountHolderName: "John Smith"     ← NUEVO
sortCode: "12-34-56"                ← NUEVO
accountNumber: "12345678"           ← NUEVO
adminNotes: "Transfer completed"
requestedAt: 2026-03-27 10:00
processedAt: 2026-03-27 10:15
processedBy: 1 (tu user ID)
```

---

## 🔧 Migración Requerida

Ejecuta en Koyeb Console (línea por línea):

```sql
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountHolderName" VARCHAR(255);
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "sortCode" VARCHAR(20);
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(20);
```

---

## ✅ Ventajas de Este Approach

1. **Simple:** No encryption, no extra tables
2. **Flexible:** Cada withdrawal puede tener diferentes datos bancarios
3. **Auditable:** Ves exactamente a quién pagaste y cuándo
4. **Sin Setup:** No necesita BANK_ENCRYPTION_KEY ni configuración extra
5. **UX Claro:** Instructor pone datos → Admin ve datos → Transfiere

---

## 🎨 UI/UX Implementado

### **Instructor Modal (Earnings.tsx):**
```
┌─────────────────────────────────────────┐
│ Request Withdrawal                      │
├─────────────────────────────────────────┤
│ Available: £125.50                      │
│                                         │
│ Amount: [    50.00    ] £ [Withdraw All]│
│                                         │
│ ────────────────────────────────────────│
│ 💳 UK Bank Account Details              │
│                                         │
│ Account Holder Name                     │
│ [John Smith                          ]  │
│                                         │
│ Sort Code        Account Number         │
│ [12-34-56]       [12345678]            │
│                                         │
│ ⚠️  Your bank details will be securely │
│    shared with the admin to process    │
│    your manual transfer.               │
│                                         │
│ [Cancel]        [Confirm Withdrawal]   │
└─────────────────────────────────────────┘
```

### **Admin Modal (AdminWithdrawals.tsx):**
```
┌─────────────────────────────────────────┐
│ Manage Withdrawal #123                  │
├─────────────────────────────────────────┤
│ £50.00                                  │
│ Requested by: John Smith                │
│                                         │
│ ╔═══════════════════════════════════╗   │
│ ║ 💳 BANK ACCOUNT DETAILS          ║   │
│ ╠═══════════════════════════════════╣   │
│ ║ Account Holder                    ║   │
│ ║ John Smith                        ║   │
│ ║                                   ║   │
│ ║ Sort Code    Account Number       ║   │
│ ║ 12-34-56     12345678            ║   │
│ ╚═══════════════════════════════════╝   │
│                                         │
│ ⚠️  Transfer £50.00 to this account    │
│    via your bank. Mark as "Paid" after │
│    completing the transfer.            │
│                                         │
│ Admin Notes (Optional)                  │
│ [                                    ]  │
│                                         │
│ [Reject]              [Mark as Paid]   │
└─────────────────────────────────────────┘
```

---

## 🔒 Seguridad

- ✅ Bank details solo visibles para admin
- ✅ Validación de formato UK (Sort Code XX-XX-XX, Account 8 dígitos)
- ✅ No se pueden editar después de crear el request
- ✅ Audit trail completo (quién, cuándo, cuánto)
- ⚠️ Datos NO encriptados (si necesitas encriptación, házmelo saber)

---

## 📄 Archivos Modificados

1. **drizzle/schema.ts** - 3 nuevos campos en withdrawalRequests
2. **server/features/financials.ts** - Validación de bank details
3. **client/src/pages/Earnings.tsx** - Form de bank details
4. **client/src/pages/AdminWithdrawals.tsx** - Display de bank details
5. **server/migrations/add-withdrawal-bank-details.sql** - SQL migration

---

## 🚀 Despliegue

1. ✅ **Código pushed a GitHub** (auto-deploys en Koyeb)
2. ⏳ **Ejecuta migración en Koyeb Console:**
   ```sql
   ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountHolderName" VARCHAR(255);
   ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "sortCode" VARCHAR(20);
   ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(20);
   ```
3. ✅ **Sistema listo para usar**

---

## 🧪 Cómo Probar

### **Test como Instructor:**
1. Login como instructor
2. Ve a Earnings
3. Request withdrawal:
   - Amount: £10
   - Name: Test User
   - Sort Code: 12-34-56
   - Account: 12345678
4. ✅ Should see "Withdrawal requested" toast
5. ✅ Should see request in "Latest Withdrawals" section

### **Test como Admin:**
1. Login como admin
2. Ve a Admin Dashboard → Withdrawals
3. Click en pending request
4. ✅ Should see bank details card
5. ✅ Should see "Transfer £10.00 to this account" warning
6. Click "Mark as Paid"
7. ✅ Should update to paid status

---

## 💰 Costos

- **Sistema:** £0.00 (todo manual)
- **Transferencias UK:** £0.00 - £0.50 por transfer (depende de tu banco)
- **Tiempo por payout:** ~2-5 minutos (login banco + transfer + mark paid)

---

## ✅ Status

- ✅ Backend implementado
- ✅ Instructor UI implementada
- ✅ Admin UI implementada
- ✅ Build passing
- ✅ Pushed a GitHub
- ⏳ Migración pendiente (tu turno)

---

**Cuando ejecutes la migración, el sistema estará 100% funcional!** 🎉
