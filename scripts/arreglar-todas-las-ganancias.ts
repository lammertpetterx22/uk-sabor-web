#!/usr/bin/env npx tsx
/**
 * Arreglar TODAS las compras sin ganancias calculadas
 * Para cursos, eventos y clases
 */

import { getDb } from "../server/db";
import {
  coursePurchases,
  eventTickets,
  classPurchases,
  orders,
  courses,
  events,
  classes,
  instructors,
  users,
  balances,
  ledgerTransactions
} from "../drizzle/schema";
import { eq, isNull, or, sql } from "drizzle-orm";
import { PLANS, PlanKey } from "../server/stripe/plans";
import { addEarnings } from "../server/features/financials";

async function arreglarTodasLasGanancias() {
  console.log("🔧 ARREGLANDO TODAS LAS GANANCIAS FALTANTES\n");
  console.log("═".repeat(70));

  const db = await getDb();
  if (!db) {
    console.error("❌ Base de datos no disponible");
    return;
  }

  let totalArregladas = 0;
  let totalGananciasAgregadas = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 1: ARREGLAR COMPRAS DE CURSOS
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("\n📚 PARTE 1: ARREGLANDO COMPRAS DE CURSOS\n");
  console.log("─".repeat(70));

  const comprasCursosSinGanancias = await db
    .select()
    .from(coursePurchases)
    .where(
      or(
        isNull(coursePurchases.instructorEarnings),
        eq(coursePurchases.instructorEarnings, "0.00" as any)
      )
    );

  console.log(`\n   Encontradas ${comprasCursosSinGanancias.length} compras de cursos sin ganancias\n`);

  for (const compra of comprasCursosSinGanancias) {
    console.log(`   🔍 Procesando compra #${compra.id}...`);

    try {
      // Obtener la orden
      if (!compra.orderId) {
        console.log(`      ⚠️  Sin orden asociada - SKIP`);
        continue;
      }

      const [orden] = await db.select().from(orders).where(eq(orders.id, compra.orderId));
      if (!orden) {
        console.log(`      ⚠️  Orden #${compra.orderId} no encontrada - SKIP`);
        continue;
      }

      // Obtener el curso
      const [curso] = await db.select().from(courses).where(eq(courses.id, compra.courseId));
      if (!curso) {
        console.log(`      ⚠️  Curso #${compra.courseId} no encontrado - SKIP`);
        continue;
      }

      if (!curso.instructorId) {
        console.log(`      ⚠️  Curso sin instructorId - SKIP`);
        continue;
      }

      // Obtener el instructor
      const [instructor] = await db.select().from(instructors).where(eq(instructors.id, curso.instructorId));
      if (!instructor || !instructor.userId) {
        console.log(`      ⚠️  Instructor sin userId - SKIP`);
        continue;
      }

      // Obtener el usuario/plan
      const [usuario] = await db.select().from(users).where(eq(users.id, instructor.userId));
      if (!usuario) {
        console.log(`      ⚠️  Usuario no encontrado - SKIP`);
        continue;
      }

      const plan = usuario.subscriptionPlan || 'starter';
      const planDef = PLANS[plan as PlanKey] || PLANS.starter;
      const commissionRate = planDef.courseCommissionRate;

      // Calcular ganancias
      const precioTotal = parseFloat(String(orden.amount));
      const precioTotalPence = Math.round(precioTotal * 100);
      const commissionPence = Math.round(precioTotalPence * commissionRate);
      const instructorEarningsPence = precioTotalPence - commissionPence;

      const platformFeeGBP = commissionPence / 100;
      const instructorEarningsGBP = instructorEarningsPence / 100;

      // Actualizar compra
      await db
        .update(coursePurchases)
        .set({
          instructorId: instructor.userId,
          pricePaid: precioTotal.toFixed(2) as any,
          platformFee: platformFeeGBP.toFixed(2) as any,
          instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
        })
        .where(eq(coursePurchases.id, compra.id));

      // Registrar ganancias (solo si no existe ya en el ledger)
      const existingLedger = await db
        .select()
        .from(ledgerTransactions)
        .where(eq(ledgerTransactions.orderId, orden.id));

      if (existingLedger.length === 0) {
        await addEarnings({
          userId: instructor.userId,
          amount: instructorEarningsGBP,
          description: `${orden.livemode ? 'Sale' : 'Test Sale'}: ${curso.title} (#${orden.id})`,
          orderId: orden.id,
        });

        totalGananciasAgregadas += instructorEarningsGBP;
      }

      console.log(`      ✅ ${usuario.name} - £${instructorEarningsGBP.toFixed(2)} (${(commissionRate*100).toFixed(1)}% comisión)`);
      totalArregladas++;

    } catch (error: any) {
      console.log(`      ❌ Error: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 2: ARREGLAR TICKETS DE EVENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("\n\n🎫 PARTE 2: ARREGLANDO TICKETS DE EVENTOS\n");
  console.log("─".repeat(70));

  const ticketsSinGanancias = await db
    .select()
    .from(eventTickets)
    .where(
      or(
        isNull(eventTickets.instructorEarnings),
        eq(eventTickets.instructorEarnings, "0.00" as any)
      )
    );

  console.log(`\n   Encontrados ${ticketsSinGanancias.length} tickets de eventos sin ganancias\n`);

  for (const ticket of ticketsSinGanancias) {
    console.log(`   🔍 Procesando ticket #${ticket.id}...`);

    try {
      // Obtener la orden
      if (!ticket.orderId) {
        console.log(`      ⚠️  Sin orden asociada - SKIP`);
        continue;
      }

      const [orden] = await db.select().from(orders).where(eq(orders.id, ticket.orderId));
      if (!orden) {
        console.log(`      ⚠️  Orden #${ticket.orderId} no encontrada - SKIP`);
        continue;
      }

      // Obtener el evento
      const [evento] = await db.select().from(events).where(eq(events.id, ticket.eventId));
      if (!evento || !evento.creatorId) {
        console.log(`      ⚠️  Evento sin creatorId - SKIP`);
        continue;
      }

      // Obtener el usuario/plan
      const [usuario] = await db.select().from(users).where(eq(users.id, evento.creatorId));
      if (!usuario) {
        console.log(`      ⚠️  Usuario no encontrado - SKIP`);
        continue;
      }

      const plan = usuario.subscriptionPlan || 'starter';
      const planDef = PLANS[plan as PlanKey] || PLANS.starter;
      const commissionRate = planDef.commissionRate; // Para eventos

      // Calcular ganancias
      const precioTotal = parseFloat(String(orden.amount));
      const precioTotalPence = Math.round(precioTotal * 100);
      const commissionPence = Math.round(precioTotalPence * commissionRate);
      const instructorEarningsPence = precioTotalPence - commissionPence;

      const platformFeeGBP = commissionPence / 100;
      const instructorEarningsGBP = instructorEarningsPence / 100;

      // Actualizar ticket
      await db
        .update(eventTickets)
        .set({
          instructorId: evento.creatorId,
          pricePaid: precioTotal.toFixed(2) as any,
          platformFee: platformFeeGBP.toFixed(2) as any,
          instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
        })
        .where(eq(eventTickets.id, ticket.id));

      // Registrar ganancias (solo si no existe ya en el ledger)
      const existingLedger = await db
        .select()
        .from(ledgerTransactions)
        .where(eq(ledgerTransactions.orderId, orden.id));

      if (existingLedger.length === 0) {
        await addEarnings({
          userId: evento.creatorId,
          amount: instructorEarningsGBP,
          description: `${orden.livemode ? 'Sale' : 'Test Sale'}: ${evento.title} (#${orden.id})`,
          orderId: orden.id,
        });

        totalGananciasAgregadas += instructorEarningsGBP;
      }

      console.log(`      ✅ ${usuario.name} - £${instructorEarningsGBP.toFixed(2)} (${(commissionRate*100).toFixed(1)}% comisión)`);
      totalArregladas++;

    } catch (error: any) {
      console.log(`      ❌ Error: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 3: ARREGLAR COMPRAS DE CLASES
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("\n\n💃 PARTE 3: ARREGLANDO COMPRAS DE CLASES\n");
  console.log("─".repeat(70));

  const comprasClasesSinGanancias = await db
    .select()
    .from(classPurchases)
    .where(
      or(
        isNull(classPurchases.instructorEarnings),
        eq(classPurchases.instructorEarnings, "0.00" as any)
      )
    );

  console.log(`\n   Encontradas ${comprasClasesSinGanancias.length} compras de clases sin ganancias\n`);

  for (const compra of comprasClasesSinGanancias) {
    console.log(`   🔍 Procesando compra clase #${compra.id}...`);

    try {
      // Obtener la orden
      if (!compra.orderId) {
        console.log(`      ⚠️  Sin orden asociada - SKIP`);
        continue;
      }

      const [orden] = await db.select().from(orders).where(eq(orders.id, compra.orderId));
      if (!orden) {
        console.log(`      ⚠️  Orden #${compra.orderId} no encontrada - SKIP`);
        continue;
      }

      // Obtener la clase
      const [clase] = await db.select().from(classes).where(eq(classes.id, compra.classId));
      if (!clase || !clase.instructorId) {
        console.log(`      ⚠️  Clase sin instructorId - SKIP`);
        continue;
      }

      // Obtener el instructor
      const [instructor] = await db.select().from(instructors).where(eq(instructors.id, clase.instructorId));
      if (!instructor || !instructor.userId) {
        console.log(`      ⚠️  Instructor sin userId - SKIP`);
        continue;
      }

      // Obtener el usuario/plan
      const [usuario] = await db.select().from(users).where(eq(users.id, instructor.userId));
      if (!usuario) {
        console.log(`      ⚠️  Usuario no encontrado - SKIP`);
        continue;
      }

      const plan = usuario.subscriptionPlan || 'starter';
      const planDef = PLANS[plan as PlanKey] || PLANS.starter;
      const commissionRate = planDef.commissionRate; // Para clases

      // Calcular ganancias
      const precioTotal = parseFloat(String(orden.amount));
      const precioTotalPence = Math.round(precioTotal * 100);
      const commissionPence = Math.round(precioTotalPence * commissionRate);
      const instructorEarningsPence = precioTotalPence - commissionPence;

      const platformFeeGBP = commissionPence / 100;
      const instructorEarningsGBP = instructorEarningsPence / 100;

      // Actualizar compra
      await db
        .update(classPurchases)
        .set({
          instructorId: instructor.userId,
          pricePaid: precioTotal.toFixed(2) as any,
          platformFee: platformFeeGBP.toFixed(2) as any,
          instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
        })
        .where(eq(classPurchases.id, compra.id));

      // Registrar ganancias (solo si no existe ya en el ledger)
      const existingLedger = await db
        .select()
        .from(ledgerTransactions)
        .where(eq(ledgerTransactions.orderId, orden.id));

      if (existingLedger.length === 0) {
        await addEarnings({
          userId: instructor.userId,
          amount: instructorEarningsGBP,
          description: `${orden.livemode ? 'Sale' : 'Test Sale'}: ${clase.title} (#${orden.id})`,
          orderId: orden.id,
        });

        totalGananciasAgregadas += instructorEarningsGBP;
      }

      console.log(`      ✅ ${usuario.name} - £${instructorEarningsGBP.toFixed(2)} (${(commissionRate*100).toFixed(1)}% comisión)`);
      totalArregladas++;

    } catch (error: any) {
      console.log(`      ❌ Error: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("\n\n═".repeat(70));
  console.log("\n✅ ¡PROCESO COMPLETADO!\n");
  console.log("📊 Resumen:\n");
  console.log(`   Total de compras arregladas: ${totalArregladas}`);
  console.log(`   Total de ganancias agregadas: £${totalGananciasAgregadas.toFixed(2)}\n`);

  // Mostrar balance actualizado de todos los profesores
  console.log("👥 Balance de profesores:\n");

  const todosBalances = await db.select().from(balances).orderBy(balances.userId);

  for (const balance of todosBalances) {
    const [usuario] = await db.select().from(users).where(eq(users.id, balance.userId));
    if (usuario && parseFloat(String(balance.totalEarned)) > 0) {
      console.log(`   ${usuario.name}: £${balance.totalEarned} ganado`);
    }
  }

  console.log("\n═".repeat(70));
  console.log("\n🎉 ¡Todos los profesores ahora tienen sus ganancias correctas!\n");
}

arreglarTodasLasGanancias().catch(console.error);
