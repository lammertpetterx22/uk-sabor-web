# 💰 Sistema de Pagos y Distribución de Fees - UK Sabor

## 🎯 Tu Pregunta

> "Si me pagan £10 por un ticket o curso, Stripe cobra su %, ¿cómo sé que le tengo que pagar £9 al profesor en vez de £10?"

**Respuesta rápida:** El sistema YA lo calcula automáticamente y lo guarda en la base de datos. Todo está rastreado en las columnas `platformFee`, `instructorEarnings` y `pricePaid`.

---

## 📊 Cómo Funciona Actualmente

### Ejemplo Práctico: Ticket de £10

```
┌─────────────────────────────────────────────────────┐
│  CLIENTE COMPRA TICKET DE £10.00                    │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  STRIPE CHECKOUT MUESTRA:                           │
│                                                      │
│  Ticket price:      £10.00                          │
│  Platform fee (8%): £ 0.80   ← UK Sabor comisión   │
│  Processing fee:    £ 0.35   ← Stripe fee          │
│  ─────────────────────────                          │
│  TOTAL A PAGAR:     £11.15                          │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  STRIPE PROCESA EL PAGO                             │
│  El cliente paga £11.15                             │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  DISTRIBUCIÓN DEL DINERO (opción actual):           │
│                                                      │
│  £11.15 → Stripe recibe todo                        │
│    - £0.35 (Stripe fee) → Stripe se queda          │
│    - £10.80 restante va a TU CUENTA de plataforma  │
│                                                      │
│  TÚ recibes: £10.80                                 │
│    - £0.80 → UK Sabor (tu comisión)                │
│    - £10.00 → Debes pagar al profesor              │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  EN LA BASE DE DATOS SE GUARDA:                     │
│                                                      │
│  eventTickets (o coursePurchases):                  │
│    pricePaid:           £10.00                      │
│    platformFee:         £ 0.80  ← TU ganancia      │
│    instructorEarnings:  £ 9.20  ← PAGAR al profesor│
│    instructorId:        123     ← Quién recibirá   │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Respuesta a Tu Pregunta

### ¿Cómo sabes cuánto pagar al profesor?

**La respuesta está en la base de datos:**

```sql
-- Ejemplo de registro en eventTickets
{
  id: 7,
  userId: 2403,              -- Cliente que compró
  eventId: 11,               -- Evento
  instructorId: 2402,        -- PROFESOR que debe recibir el pago
  pricePaid: "18.50",        -- Lo que pagó el cliente
  platformFee: "2.78",       -- TU ganancia (15%)
  instructorEarnings: "15.72", -- ← ESTO es lo que le debes pagar
  ticketCode: "EVT-LIVE...",
  status: "valid"
}
```

**Cuando quieras pagar al profesor:**

```typescript
// Consulta todos los earnings pendientes del profesor
const earnings = await db
  .select()
  .from(eventTickets)
  .where(eq(eventTickets.instructorId, profesorId));

// Suma total a pagar
const totalToP = earnings.reduce((sum, ticket) => {
  return sum + parseFloat(ticket.instructorEarnings);
}, 0);

console.log(`Debes pagar al profesor: £${totalToPay.toFixed(2)}`);
```

---

## 💳 Dos Opciones de Implementación con Stripe

### **OPCIÓN 1: Modelo Actual (Platform-first)**

**Cómo funciona:**
1. Todo el dinero va a TU cuenta de Stripe
2. TÚ pagas manualmente a los profesores después
3. Tienes control total del dinero

**Ventajas:**
- ✅ Más simple de implementar
- ✅ Control total del cash flow
- ✅ Puedes retener pagos si hay problemas
- ✅ No necesitas Stripe Connect

**Desventajas:**
- ❌ Tienes que hacer transferencias manuales
- ❌ Responsabilidad legal de los fondos
- ❌ Los profesores no reciben dinero inmediatamente

**Flujo:**
```
Cliente → Stripe → TU CUENTA UK Sabor
                         │
                         └─→ (manual) → Cuenta profesor
```

---

### **OPCIÓN 2: Stripe Connect (Split automático)**

**Cómo funciona:**
1. Cada profesor tiene una cuenta Stripe Connect
2. El dinero se divide AUTOMÁTICAMENTE
3. Profesor recibe su parte directamente

**Ventajas:**
- ✅ Automático, sin transfers manuales
- ✅ Profesor recibe dinero inmediatamente
- ✅ Cumplimiento legal más claro
- ✅ Profesores ven su dashboard de Stripe

**Desventajas:**
- ❌ Más complejo de implementar
- ❌ Cada profesor necesita cuenta Stripe
- ❌ Menos control del cash flow
- ❌ Stripe cobra fee adicional (~0.25%)

**Flujo:**
```
Cliente → Stripe → SPLIT AUTOMÁTICO
                      ├─→ Profesor (85%) → Su cuenta Stripe
                      └─→ UK Sabor (15%) → Tu cuenta Stripe
```

**Código actual que lo soporta:**

```typescript
// En server/features/payments.ts líneas 71-74
const payment_intent_data = creatorRow?.stripeAccountId ? {
  application_fee_amount: fees.platformFeePence + fees.stripeFeePence,
  transfer_data: { destination: creatorRow.stripeAccountId },
} : undefined;
```

**Para activarlo:**
1. Cada profesor necesita `stripeAccountId` en su registro de usuario
2. Crear cuenta Stripe Connect para cada profesor
3. El split se hace automáticamente

---

## 📈 Comisiones por Plan (Current System)

Tu plataforma tiene diferentes planes con diferentes comisiones:

| Plan | Comisión Tickets | Comisión Cursos | Profesor Recibe |
|------|------------------|-----------------|-----------------|
| **Starter** (Free) | 8% | 15% | 92% / 85% |
| **Creator** (£5/mes) | 4% | 10% | 96% / 90% |
| **Promoter** (£10/mes) | 2.5% | 5% | 97.5% / 95% |
| **Academy** (£25/mes) | 2% | 0% | 98% / 100% |

### Ejemplo con diferentes planes:

**Ticket de £100 - Plan Starter:**
```
Cliente paga:     £100.00 (precio)
                  +  £8.00 (platform fee 8%)
                  +  £1.62 (Stripe fee)
                = £109.62 TOTAL

UK Sabor recibe:  £  8.00
Profesor recibe:  £ 92.00 ← Guardado en instructorEarnings
```

**Ticket de £100 - Plan Academy:**
```
Cliente paga:     £100.00 (precio)
                  +  £2.00 (platform fee 2%)
                  +  £1.53 (Stripe fee)
                = £103.53 TOTAL

UK Sabor recibe:  £  2.00
Profesor recibe:  £ 98.00 ← Guardado en instructorEarnings
```

---

## 🗂️ Estructura de Base de Datos

### Tablas con información de earnings:

#### `eventTickets`
```typescript
{
  id: number,
  userId: number,           // Cliente
  eventId: number,
  instructorId: number,     // ← Profesor que recibe
  pricePaid: decimal,       // Lo que pagó el cliente
  platformFee: decimal,     // ← TU ganancia
  instructorEarnings: decimal, // ← PAGAR al profesor
  ticketCode: string,
  status: "valid" | "used"
}
```

#### `coursePurchases`
```typescript
{
  id: number,
  userId: number,           // Cliente
  courseId: number,
  instructorId: number,     // ← Profesor que recibe
  pricePaid: decimal,       // Lo que pagó el cliente
  platformFee: decimal,     // ← TU ganancia
  instructorEarnings: decimal, // ← PAGAR al profesor
  progress: number,
  completed: boolean
}
```

#### `classPurchases`
```typescript
{
  id: number,
  userId: number,           // Cliente
  classId: number,
  instructorId: number,     // ← Profesor que recibe
  pricePaid: decimal,       // Lo que pagó el cliente
  platformFee: decimal,     // ← TU ganancia
  instructorEarnings: decimal, // ← PAGAR al profesor
  accessCode: string,
  status: "active"
}
```

---

## 📊 Consultas Útiles

### 1. Ver cuánto le debes a UN profesor:

```typescript
// Total de eventos
const eventEarnings = await db
  .select({ total: sum(eventTickets.instructorEarnings) })
  .from(eventTickets)
  .where(eq(eventTickets.instructorId, profesorUserId));

// Total de cursos
const courseEarnings = await db
  .select({ total: sum(coursePurchases.instructorEarnings) })
  .from(coursePurchases)
  .where(eq(coursePurchases.instructorId, profesorUserId));

// Total de clases
const classEarnings = await db
  .select({ total: sum(classPurchases.instructorEarnings) })
  .from(classPurchases)
  .where(eq(classPurchases.instructorId, profesorUserId));

const totalDebt =
  (eventEarnings[0]?.total || 0) +
  (courseEarnings[0]?.total || 0) +
  (classEarnings[0]?.total || 0);

console.log(`Debes pagar al profesor: £${totalDebt.toFixed(2)}`);
```

### 2. Ver tus ganancias totales (plataforma):

```typescript
const platformEarnings = await db
  .select({
    eventFees: sum(eventTickets.platformFee),
    courseFees: sum(coursePurchases.platformFee),
    classFees: sum(classPurchases.platformFee),
  })
  .from(eventTickets)
  .fullJoin(coursePurchases, ...)
  .fullJoin(classPurchases, ...);

const totalRevenue =
  (platformEarnings.eventFees || 0) +
  (platformEarnings.courseFees || 0) +
  (platformEarnings.classFees || 0);

console.log(`Ganancias de la plataforma: £${totalRevenue.toFixed(2)}`);
```

### 3. Ver todas las ventas con detalles:

```typescript
const sales = await db
  .select({
    type: sql`'event'`,
    saleId: eventTickets.id,
    cliente: users.name,
    precio: eventTickets.pricePaid,
    tuGanancia: eventTickets.platformFee,
    pagarAlProfesor: eventTickets.instructorEarnings,
    profesorId: eventTickets.instructorId,
    fecha: eventTickets.purchasedAt,
  })
  .from(eventTickets)
  .leftJoin(users, eq(users.id, eventTickets.userId));

// Similar para courses y classes...
```

---

## 💡 Recomendación

### Para empezar:
**USA OPCIÓN 1** (Platform-first, actual)
- Más simple
- Control total
- Pagas manualmente cada mes a los profesores

### Cuando crezcas:
**MIGRA A OPCIÓN 2** (Stripe Connect)
- Automatic splits
- Escalable
- Menos trabajo manual

---

## 🎯 Resumen Final

### ¿Cómo saber cuánto pagar?

```typescript
// SIMPLE: Lee la columna instructorEarnings
const ticket = await db
  .select()
  .from(eventTickets)
  .where(eq(eventTickets.id, ticketId))
  .limit(1);

console.log(`Precio pagado: £${ticket.pricePaid}`);
console.log(`Tu ganancia: £${ticket.platformFee}`);
console.log(`Pagar al profesor: £${ticket.instructorEarnings}`); // ← ESTO
```

### El cálculo se hace automáticamente en:

**Archivo:** `server/stripe/webhook.ts` líneas 160-180

```typescript
// Cuando el webhook de Stripe confirma el pago:
const platformFee = netEarnings * commissionRate; // Tu ganancia
const instructorEarnings = netEarnings - platformFee; // Para el profesor

// Se guarda en la base de datos:
await db.insert(eventTickets).values({
  pricePaid: price,
  platformFee: platformFee,
  instructorEarnings: instructorEarnings, // ← Ya calculado
  instructorId: profesorUserId,
});
```

---

## 🚀 Próximos Pasos

1. **Revisar el dashboard de Earnings** en `/earnings`
2. **Implementar página de Withdrawals** para profesores
3. **Decidir:** ¿Pagos manuales o Stripe Connect?
4. **Tracking:** Sistema de pagos completados

¿Necesitas ayuda implementando alguna de estas opciones?
