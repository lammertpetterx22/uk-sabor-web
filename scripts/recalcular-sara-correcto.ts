#!/usr/bin/env npx tsx
/**
 * RECALCULAR las ganancias de Sara CORRECTAMENTE
 * El Stripe fee NO debe incluirse en las ganancias
 */

import { getDb } from "../server/db";
import { coursePurchases, orders, courses, users, balances, ledgerTransactions } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { PLANS, PlanKey } from "../server/stripe/plans";

async function recalcularSaraCorrectamente() {
  console.log("🔧 RECALCULANDO GANANCIAS DE SARA CORRECTAMENTE\n");
  console.log("═".repeat(70));

  const db = await getDb();
  if (!db) {
    console.error("❌ Base de datos no disponible");
    return;
  }

  // Datos de Sara
  const COMPRA_ID = 13;
  const ORDEN_ID = 33;
  const USER_ID = 2677;

  // 1. Obtener la orden
  const [orden] = await db.select().from(orders).where(eq(orders.id, ORDEN_ID));
  if (!orden) {
    console.error("❌ Orden no encontrada");
    return;
  }

  console.log("\n📊 Datos de la orden:\n");
  console.log(`   Orden ID: #${orden.id}`);
  console.log(`   Monto TOTAL pagado por cliente: £${orden.amount}`);
  console.log(`   (Este total INCLUYE el Stripe processing fee)`);

  // 2. Obtener plan de Sara
  const [usuario] = await db.select().from(users).where(eq(users.id, USER_ID));
  if (!usuario) {
    console.error("❌ Usuario no encontrado");
    return;
  }

  const plan = usuario.subscriptionPlan || 'starter';
  const planDef = PLANS[plan as PlanKey] || PLANS.starter;
  const commissionRate = planDef.courseCommissionRate;

  console.log(`\n   Plan de Sara: ${plan}`);
  console.log(`   Comisión para cursos: ${(commissionRate * 100).toFixed(1)}%`);

  // 3. CÁLCULO CORRECTO
  console.log("\n📊 CÁLCULO CORRECTO (sin Stripe fee):\n");

  const totalPagadoPence = Math.round(parseFloat(String(orden.amount)) * 100);

  // El Stripe fee en UK es: 1.5% + £0.20
  // Fórmula: total = ticketPrice + stripeFee
  // total = ticketPrice + (ticketPrice * 0.015 + 20)
  // total = ticketPrice * 1.015 + 20
  // ticketPrice = (total - 20) / 1.015

  const ticketPricePence = Math.round((totalPagadoPence - 20) / 1.015);
  const stripeFeeCalculado = totalPagadoPence - ticketPricePence;

  // Comisión solo sobre el precio del ticket (SIN Stripe fee)
  const platformFeePence = Math.round(ticketPricePence * commissionRate);
  const instructorEarningsPence = ticketPricePence - platformFeePence;

  const ticketPriceGBP = ticketPricePence / 100;
  const stripeFeeGBP = stripeFeeCalculado / 100;
  const platformFeeGBP = platformFeePence / 100;
  const instructorEarningsGBP = instructorEarningsPence / 100;

  console.log(`   💰 Total pagado por cliente: £${(totalPagadoPence/100).toFixed(2)}`);
  console.log(`   ├─ 🎫 Precio del curso: £${ticketPriceGBP.toFixed(2)}`);
  console.log(`   └─ 💳 Stripe fee (cliente): £${stripeFeeGBP.toFixed(2)}`);
  console.log(``);
  console.log(`   📊 Desglose de £${ticketPriceGBP.toFixed(2)} (precio del curso):`);
  console.log(`   ├─ 💸 Comisión plataforma (${(commissionRate*100).toFixed(1)}%): £${platformFeeGBP.toFixed(2)}`);
  console.log(`   └─ ✨ Ganancia para Sara: £${instructorEarningsGBP.toFixed(2)}`);

  // 4. Comparar con lo que calculé antes
  const [compraActual] = await db.select().from(coursePurchases).where(eq(coursePurchases.id, COMPRA_ID));
  const gananciaAnterior = parseFloat(String(compraActual?.instructorEarnings || 0));

  console.log(`\n📊 COMPARACIÓN:\n`);
  console.log(`   Ganancia ANTERIOR (incorrecta): £${gananciaAnterior.toFixed(2)}`);
  console.log(`   Ganancia CORRECTA (sin Stripe fee): £${instructorEarningsGBP.toFixed(2)}`);
  console.log(`   Diferencia: £${(gananciaAnterior - instructorEarningsGBP).toFixed(2)} (${gananciaAnterior > instructorEarningsGBP ? 'DE MÁS ❌' : 'DE MENOS'})`);

  if (Math.abs(gananciaAnterior - instructorEarningsGBP) < 0.01) {
    console.log(`\n✅ ¡Las ganancias ya están correctas! No need to fix.\n`);
    return;
  }

  // 5. Preguntar si actualizar
  console.log(`\n🔧 ¿Actualizar las ganancias de Sara?\n`);
  console.log(`   Voy a:`);
  console.log(`   1. Actualizar coursePurchases con los valores correctos`);
  console.log(`   2. Ajustar el balance de Sara`);
  console.log(`   3. Agregar una entrada de ajuste en el ledger\n`);

  // 6. Actualizar compra
  await db
    .update(coursePurchases)
    .set({
      pricePaid: ticketPriceGBP.toFixed(2) as any,
      platformFee: platformFeeGBP.toFixed(2) as any,
      instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
    })
    .where(eq(coursePurchases.id, COMPRA_ID));

  console.log(`   ✅ Compra actualizada con valores correctos`);

  // 7. Ajustar balance
  const diferencia = instructorEarningsGBP - gananciaAnterior;

  await db
    .update(balances)
    .set({
      currentBalance: sql`${balances.currentBalance} + ${diferencia.toFixed(2)}`,
      totalEarned: sql`${balances.totalEarned} + ${diferencia.toFixed(2)}`,
    })
    .where(eq(balances.userId, USER_ID));

  console.log(`   ✅ Balance ajustado: ${diferencia > 0 ? '+' : ''}£${diferencia.toFixed(2)}`);

  // 8. Registrar ajuste en ledger
  await db.insert(ledgerTransactions).values({
    userId: USER_ID,
    amount: diferencia.toFixed(2) as any,
    type: "earning",
    description: `Adjustment: Corrected Stripe fee calculation for order #${ORDEN_ID}`,
    orderId: ORDEN_ID,
    status: "completed",
  });

  console.log(`   ✅ Ajuste registrado en ledger`);

  // 9. Verificar resultado final
  const [balanceFinal] = await db.select().from(balances).where(eq(balances.userId, USER_ID));

  console.log(`\n═`.repeat(70));
  console.log(`\n✅ ¡RECÁLCULO COMPLETADO!\n`);
  console.log(`📊 Balance final de Sara:\n`);
  console.log(`   Balance actual: £${balanceFinal.currentBalance}`);
  console.log(`   Total ganado: £${balanceFinal.totalEarned}`);
  console.log(``);
  console.log(`💡 Explicación:\n`);
  console.log(`   Cliente pagó: £${(totalPagadoPence/100).toFixed(2)}`);
  console.log(`   ├─ Precio curso: £${ticketPriceGBP.toFixed(2)}`);
  console.log(`   └─ Stripe fee: £${stripeFeeGBP.toFixed(2)} (pagado por cliente, no se descuenta a Sara)`);
  console.log(``);
  console.log(`   De los £${ticketPriceGBP.toFixed(2)} del curso:`);
  console.log(`   ├─ Plataforma UK Sabor: £${platformFeeGBP.toFixed(2)} (${(commissionRate*100).toFixed(1)}%)`);
  console.log(`   └─ Sara Bartosova: £${instructorEarningsGBP.toFixed(2)} ✨`);
  console.log(`\n═`.repeat(70));
}

recalcularSaraCorrectamente().catch(console.error);
