# 🔧 Stripe Fee Calculation Fix - Gross-Up Formula

## 📝 PROBLEMA IDENTIFICADO

Cuando un cliente compra un ticket de £9.99, pagaba £10.35 (£9.99 + fee estimado de £0.36), pero Stripe cobraba £0.36 sobre el total de £10.35, no sobre £9.99. Esto causaba una discrepancia de £0.01 por transacción.

### Ejemplo del problema:

```
Ticket price: £9.99 (999 pence)
Stripe fee (calculado incorrectamente): £9.99 × 1.5% + £0.20 = £0.35
Cliente paga: £10.35

PERO... Stripe cobra su fee sobre £10.35, no sobre £9.99:
Real Stripe fee: £10.35 × 1.5% + £0.20 = £0.3552 ≈ £0.36
Tú recibes: £10.35 - £0.36 = £9.99 ❌

Pérdida: £0.01 por transacción
```

## ✅ SOLUCIÓN: Fórmula "Gross-Up"

La solución es calcular **inversamente** cuánto debe pagar el cliente para que, después de que Stripe tome su fee, recibamos **exactamente** el precio del ticket.

### Matemática:

Queremos recibir: `T` (ticket price)
Stripe cobra: `1.5% + £0.20` sobre el total cobrado al cliente
Cliente debe pagar: `X` (esto es lo que debemos calcular)

```
Stripe fee = X × 1.5% + £0.20 = 0.015X + 0.20
Después del fee recibimos: X - (0.015X + 0.20) = T

Resolviendo para X:
X - 0.015X - 0.20 = T
0.985X = T + 0.20
X = (T + 0.20) / 0.985
```

### Fórmula implementada:

```typescript
const STRIPE_PERCENTAGE = 0.015;  // 1.5%
const STRIPE_FIXED_PENCE = 20;    // £0.20

// Gross-up calculation
const totalPence = Math.round((ticketPricePence + STRIPE_FIXED_PENCE) / (1 - STRIPE_PERCENTAGE));

// Stripe fee es la diferencia
const stripeFeePence = totalPence - ticketPricePence;
```

## 🧪 VALIDACIÓN

Ejecuta el script de prueba:

```bash
npx tsx scripts/test-stripe-fee-calculation.ts
```

### Resultados con ticket de £9.99:

```
Client pays:          £10.35
  ├─ Ticket price:    £9.99
  └─ Stripe fee:      £0.36

After Stripe takes their fee:
  Total received:     £9.99 ✅

VERIFICATION:
  Stripe charges on £10.35:
    → 10.35 × 1.5% + £0.20 = £0.36
  Amount you receive:
    → £10.35 - £0.36 = £9.99
  Expected to receive: £9.99
  Difference: £0.00 ✅ PERFECT!
```

## 📊 COMPARACIÓN ANTES vs DESPUÉS

### ANTES (cálculo incorrecto):

| Ticket | Fee Calculado | Cliente Paga | Fee Real Stripe | Tú Recibes | Diferencia |
|--------|---------------|--------------|-----------------|------------|------------|
| £5.00  | £0.28         | £5.28        | £0.28           | £5.00      | £0.00 ✅   |
| £9.99  | £0.35         | £10.34       | £0.36           | £9.98      | -£0.01 ❌  |
| £10.00 | £0.35         | £10.35       | £0.36           | £9.99      | -£0.01 ❌  |
| £15.00 | £0.43         | £15.43       | £0.43           | £15.00     | £0.00 ✅   |
| £20.00 | £0.50         | £20.50       | £0.51           | £19.99     | -£0.01 ❌  |

### DESPUÉS (gross-up correcto):

| Ticket | Fee Calculado | Cliente Paga | Fee Real Stripe | Tú Recibes | Diferencia |
|--------|---------------|--------------|-----------------|------------|------------|
| £5.00  | £0.28         | £5.28        | £0.28           | £5.00      | £0.00 ✅   |
| £9.99  | £0.36         | £10.35       | £0.36           | £9.99      | £0.00 ✅   |
| £10.00 | £0.36         | £10.36       | £0.36           | £10.00     | £0.00 ✅   |
| £15.00 | £0.43         | £15.43       | £0.43           | £15.00     | £0.00 ✅   |
| £20.00 | £0.51         | £20.51       | £0.51           | £20.00     | £0.00 ✅   |

## 🎯 BENEFICIOS

1. **Precisión matemática**: Recibes EXACTAMENTE el precio del ticket que estableciste
2. **Sin pérdidas**: No más pennies perdidos por redondeo
3. **Automático**: El sistema calcula el fee correcto automáticamente
4. **Transparente**: El cliente ve exactamente lo que paga (ticket + Stripe fee)
5. **Escalable**: Funciona para cualquier precio de ticket

## 📂 ARCHIVOS MODIFICADOS

- `server/stripe/plans.ts` - Función `calculateCheckoutAmounts()` actualizada con gross-up formula
- `scripts/test-stripe-fee-calculation.ts` - Script de prueba para validar cálculos

## 🚀 PRÓXIMOS PASOS

1. ✅ Código actualizado con gross-up formula
2. ✅ Tests verificados - todos los cálculos son exactos
3. ⚠️ **IMPORTANTE**: Las transacciones futuras usarán el cálculo correcto automáticamente
4. 💡 **OPCIONAL**: Si quieres, puedo crear un script para verificar transacciones pasadas y calcular la discrepancia total

## 🤓 EXPLICACIÓN TÉCNICA DETALLADA

### ¿Por qué la fórmula simple falló?

El problema es que Stripe cobra su fee sobre el **monto total cobrado al cliente**, no sobre el ticket price.

```
Si cobras:    £10.00 + £0.35 = £10.35
Stripe cobra: £10.35 × 1.5% + £0.20 = £0.3552 ≈ £0.36  (no £0.35!)
```

### ¿Cómo funciona el gross-up?

"Gross-up" significa calcular hacia arriba: en lugar de agregar el fee al precio, calculamos cuánto necesitamos cobrar para que después del fee nos quede el precio deseado.

```
Queremos:     £10.00 después del fee
Stripe cobra: 1.5% + £0.20
Debemos cobrar: (£10.00 + £0.20) / 0.985 = £10.355 ≈ £10.36

Verificación:
£10.36 × 1.5% + £0.20 = £0.3554 ≈ £0.36
£10.36 - £0.36 = £10.00 ✅ EXACTO!
```

### Stripe UK Fees

- **Tarjetas europeas**: 1.5% + £0.20 (lo que usamos)
- **Tarjetas UK**: 1.4% + £0.20
- **Tarjetas internacionales**: 2.9% + £0.20

Usamos 1.5% + £0.20 como estimado seguro para tarjetas europeas, que es el caso más común en UK.

## 📞 SOPORTE

Si tienes dudas sobre el cálculo o necesitas ajustes, revisa:
1. La documentación en `server/stripe/plans.ts` (líneas 266-344)
2. Los tests en `scripts/test-stripe-fee-calculation.ts`
3. Este documento

---

**Implementado**: 2026-04-01
**Autor**: Claude Code Assistant
**Validado**: ✅ Todos los tests pasando
