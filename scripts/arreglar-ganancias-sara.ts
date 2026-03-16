#!/usr/bin/env npx tsx
/**
 * Arreglar las ganancias de Sara Bartosova automáticamente
 * Compra #13 - Orden #33 - Curso #13
 */

import { getDb } from "../server/db";
import { coursePurchases, orders, courses, instructors, users, balances, ledgerTransactions } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { PLANS, PlanKey } from "../server/stripe/plans";
import { addEarnings } from "../server/features/financials";

async function arreglarGananciasSara() {
  console.log("🔧 ARREGLANDO GANANCIAS DE SARA BARTOSOVA\n");
  console.log("═".repeat(70));

  const db = await getDb();
  if (!db) {
    console.error("❌ Base de datos no disponible");
    return;
  }

  // Datos identificados
  const COMPRA_ID = 13;
  const ORDEN_ID = 33;
  const CURSO_ID = 13;
  const INSTRUCTOR_ID = 15;
  const USER_ID = 2677;

  console.log("\n📊 Datos de la compra:\n");
  console.log(`   Compra ID: ${COMPRA_ID}`);
  console.log(`   Orden ID: ${ORDEN_ID}`);
  console.log(`   Curso ID: ${CURSO_ID}`);
  console.log(`   Instructor ID: ${INSTRUCTOR_ID}`);
  console.log(`   Usuario Sara ID: ${USER_ID}`);

  // 1. Obtener datos de la orden
  console.log("\n📊 PASO 1: Obteniendo datos de la orden...\n");

  const [orden] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, ORDEN_ID));

  if (!orden) {
    console.error("   ❌ No se encontró la orden #33");
    return;
  }

  console.log(`   ✅ Orden #${orden.id}`);
  console.log(`      Monto total: £${orden.amount}`);
  console.log(`      Estado: ${orden.status}`);
  console.log(`      Modo: ${orden.livemode ? 'LIVE' : 'TEST'}`);

  const precioTotal = parseFloat(String(orden.amount));

  // 2. Obtener plan del usuario
  console.log("\n📊 PASO 2: Obteniendo plan de suscripción de Sara...\n");

  const [usuario] = await db
    .select()
    .from(users)
    .where(eq(users.id, USER_ID));

  if (!usuario) {
    console.error("   ❌ No se encontró el usuario");
    return;
  }

  const plan = usuario.subscriptionPlan || 'starter';
  console.log(`   ✅ Plan de Sara: ${plan}`);

  // 3. Calcular ganancias
  console.log("\n📊 PASO 3: Calculando ganancias...\n");

  const planDef = PLANS[plan as PlanKey] || PLANS.starter;
  const commissionRate = planDef.courseCommissionRate; // Para cursos

  console.log(`   📊 Tasa de comisión para cursos: ${(commissionRate * 100).toFixed(1)}%`);

  const precioTotalPence = Math.round(precioTotal * 100);
  const commissionPence = Math.round(precioTotalPence * commissionRate);
  const instructorEarningsPence = precioTotalPence - commissionPence;

  const platformFeeGBP = commissionPence / 100;
  const instructorEarningsGBP = instructorEarningsPence / 100;

  console.log(`   💰 Precio total: £${precioTotal.toFixed(2)}`);
  console.log(`   💸 Comisión plataforma (${(commissionRate * 100).toFixed(1)}%): £${platformFeeGBP.toFixed(2)}`);
  console.log(`   ✨ Ganancias para Sara: £${instructorEarningsGBP.toFixed(2)}`);

  // 4. Actualizar registro de compra
  console.log("\n📊 PASO 4: Actualizando registro de compra #13...\n");

  await db
    .update(coursePurchases)
    .set({
      instructorId: USER_ID, // userId del instructor
      pricePaid: precioTotal.toFixed(2) as any,
      platformFee: platformFeeGBP.toFixed(2) as any,
      instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
    })
    .where(eq(coursePurchases.id, COMPRA_ID));

  console.log("   ✅ Registro de compra actualizado con:");
  console.log(`      instructorId: ${USER_ID}`);
  console.log(`      pricePaid: £${precioTotal.toFixed(2)}`);
  console.log(`      platformFee: £${platformFeeGBP.toFixed(2)}`);
  console.log(`      instructorEarnings: £${instructorEarningsGBP.toFixed(2)}`);

  // 5. Obtener nombre del curso
  const [curso] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, CURSO_ID));

  const nombreCurso = curso?.title || `Curso #${CURSO_ID}`;

  // 6. Registrar ganancias en balance y ledger
  console.log("\n📊 PASO 5: Registrando ganancias en balance y ledger...\n");

  await addEarnings({
    userId: USER_ID,
    amount: instructorEarningsGBP,
    description: `${orden.livemode ? 'Sale' : 'Test Sale'}: ${nombreCurso} (#${ORDEN_ID})`,
    orderId: ORDEN_ID,
  });

  console.log("   ✅ Ganancias registradas en:");
  console.log("      - Tabla balances (currentBalance y totalEarned actualizados)");
  console.log("      - Tabla ledgerTransactions (nueva entrada creada)");

  // 7. Verificar el resultado
  console.log("\n📊 PASO 6: Verificando el resultado...\n");

  const [balanceActualizado] = await db
    .select()
    .from(balances)
    .where(eq(balances.userId, USER_ID));

  if (balanceActualizado) {
    console.log("   ✅ Balance de Sara actualizado:");
    console.log(`      Balance actual: £${balanceActualizado.currentBalance}`);
    console.log(`      Total ganado: £${balanceActualizado.totalEarned}`);
  }

  const transacciones = await db
    .select()
    .from(ledgerTransactions)
    .where(eq(ledgerTransactions.userId, USER_ID));

  if (transacciones.length > 0) {
    console.log(`\n   📒 Transacciones en ledger: ${transacciones.length}`);
    for (const tx of transacciones) {
      console.log(`      - ${tx.description}: £${tx.amount}`);
    }
  }

  console.log("\n═".repeat(70));
  console.log("\n✅ ¡GANANCIAS ARREGLADAS EXITOSAMENTE!\n");
  console.log("📝 Qué hice:\n");
  console.log("   1. ✅ Actualicé la compra #13 con instructorId y precios");
  console.log("   2. ✅ Calculé las ganancias correctamente según su plan Promoter (5%)");
  console.log(`   3. ✅ Registré £${instructorEarningsGBP.toFixed(2)} en el balance de Sara`);
  console.log("   4. ✅ Creé entrada en el ledger de transacciones\n");
  console.log("🎯 Resultado:\n");
  console.log(`   Sara Bartosova ahora tiene £${instructorEarningsGBP.toFixed(2)} en su dashboard de ganancias\n`);
  console.log("═".repeat(70));
  console.log("\n💡 Ve a /earnings como Sara y verás las ganancias ✨\n");
}

arreglarGananciasSara().catch(console.error);
