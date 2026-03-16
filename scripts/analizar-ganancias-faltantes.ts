#!/usr/bin/env npx tsx
/**
 * Analizar órdenes sin ganancias registradas
 * y proporcionar un informe detallado
 */

import { getDb } from "../server/db";
import { orders, coursePurchases, eventTickets, classPurchases, balances, ledgerTransactions, courses, events, classes, instructors, users } from "../drizzle/schema";
import { eq, sql, and, isNull } from "drizzle-orm";

async function analizarGananciasFaltantes() {
  console.log("🔍 ANÁLISIS DE GANANCIAS PARA PROFESORES\n");
  console.log("═".repeat(70));

  const db = await getDb();
  if (!db) {
    console.error("❌ Base de datos no disponible");
    return;
  }

  // 1. Analizar órdenes completadas
  console.log("\n📊 PASO 1: Analizando órdenes completadas...\n");

  const todasOrdenes = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      amount: orders.amount,
      status: orders.status,
      itemType: orders.itemType,
      itemId: orders.itemId,
      livemode: orders.livemode,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.status, "completed"))
    .orderBy(orders.id);

  console.log(`   Total órdenes completadas: ${todasOrdenes.length}`);

  const ordenesTest = todasOrdenes.filter(o => o.livemode === false);
  const ordenesLive = todasOrdenes.filter(o => o.livemode === true);

  console.log(`   🧪 Órdenes TEST: ${ordenesTest.length}`);
  console.log(`   💰 Órdenes LIVE: ${ordenesLive.length}`);

  // 2. Analizar compras por tipo
  console.log("\n📊 PASO 2: Analizando compras por tipo...\n");

  const comprasCursos = await db.select().from(coursePurchases);
  const ticketsEventos = await db.select().from(eventTickets);
  const comprasClases = await db.select().from(classPurchases);

  console.log(`   📚 Compras de cursos: ${comprasCursos.length}`);
  console.log(`   🎫 Tickets de eventos: ${ticketsEventos.length}`);
  console.log(`   💃 Compras de clases: ${comprasClases.length}`);

  const totalCompras = comprasCursos.length + ticketsEventos.length + comprasClases.length;
  console.log(`\n   📦 Total registros de compra: ${totalCompras}`);
  console.log(`   📦 Total órdenes: ${todasOrdenes.length}`);

  if (totalCompras < todasOrdenes.length) {
    console.log(`   ⚠️  Faltan ${todasOrdenes.length - totalCompras} registros de compra`);
  }

  // 3. Identificar órdenes sin registro de compra
  console.log("\n📊 PASO 3: Identificando órdenes sin registro de compra...\n");

  const ordenesSinCompra: any[] = [];

  for (const orden of todasOrdenes) {
    let tieneCompra = false;

    if (orden.itemType === "course") {
      const compra = comprasCursos.find(c => c.orderId === orden.id);
      tieneCompra = !!compra;
    } else if (orden.itemType === "event") {
      const ticket = ticketsEventos.find(t => t.orderId === orden.id);
      tieneCompra = !!ticket;
    } else if (orden.itemType === "class") {
      const compra = comprasClases.find(c => c.orderId === orden.id);
      tieneCompra = !!compra;
    }

    if (!tieneCompra) {
      ordenesSinCompra.push(orden);
    }
  }

  if (ordenesSinCompra.length > 0) {
    console.log(`   ❌ ${ordenesSinCompra.length} órdenes NO tienen registro de compra:\n`);

    for (const orden of ordenesSinCompra.slice(0, 10)) {
      console.log(`      Orden #${orden.id} - ${orden.itemType} #${orden.itemId} - £${orden.amount} - ${orden.livemode ? 'LIVE' : 'TEST'}`);
    }

    if (ordenesSinCompra.length > 10) {
      console.log(`      ... y ${ordenesSinCompra.length - 10} más`);
    }
  } else {
    console.log(`   ✅ Todas las órdenes tienen registro de compra`);
  }

  // 4. Analizar compras sin ganancias registradas
  console.log("\n📊 PASO 4: Analizando compras sin ganancias...\n");

  const comprasSinGanancias: any[] = [];

  for (const compra of comprasCursos) {
    if (!compra.instructorEarnings || parseFloat(String(compra.instructorEarnings)) === 0) {
      comprasSinGanancias.push({
        tipo: 'curso',
        id: compra.id,
        orderId: compra.orderId,
        instructorId: compra.instructorId,
        pricePaid: compra.pricePaid,
      });
    }
  }

  for (const ticket of ticketsEventos) {
    if (!ticket.instructorEarnings || parseFloat(String(ticket.instructorEarnings)) === 0) {
      comprasSinGanancias.push({
        tipo: 'evento',
        id: ticket.id,
        orderId: ticket.orderId,
        instructorId: ticket.instructorId,
        pricePaid: ticket.pricePaid,
      });
    }
  }

  for (const compra of comprasClases) {
    if (!compra.instructorEarnings || parseFloat(String(compra.instructorEarnings)) === 0) {
      comprasSinGanancias.push({
        tipo: 'clase',
        id: compra.id,
        orderId: compra.orderId,
        instructorId: compra.instructorId,
        pricePaid: compra.pricePaid,
      });
    }
  }

  if (comprasSinGanancias.length > 0) {
    console.log(`   ⚠️  ${comprasSinGanancias.length} compras SIN ganancias calculadas:\n`);

    for (const compra of comprasSinGanancias.slice(0, 10)) {
      console.log(`      ${compra.tipo} #${compra.id} - Orden #${compra.orderId} - Instructor #${compra.instructorId} - £${compra.pricePaid}`);
    }

    if (comprasSinGanancias.length > 10) {
      console.log(`      ... y ${comprasSinGanancias.length - 10} más`);
    }
  } else {
    console.log(`   ✅ Todas las compras tienen ganancias calculadas`);
  }

  // 5. Resumen de balances
  console.log("\n📊 PASO 5: Resumen de balances de profesores...\n");

  const todosBalances = await db.select().from(balances).orderBy(balances.userId);

  let totalGananciasAcumuladas = 0;
  let profesoresConGanancias = 0;
  let profesoresSinGanancias = 0;

  for (const balance of todosBalances) {
    const ganancias = parseFloat(String(balance.totalEarned || 0));
    totalGananciasAcumuladas += ganancias;

    if (ganancias > 0) {
      profesoresConGanancias++;
    } else {
      profesoresSinGanancias++;
    }
  }

  console.log(`   👥 Total profesores con balance: ${todosBalances.length}`);
  console.log(`   ✅ Profesores con ganancias: ${profesoresConGanancias}`);
  console.log(`   ⚠️  Profesores sin ganancias: ${profesoresSinGanancias}`);
  console.log(`   💰 Total ganancias acumuladas: £${totalGananciasAcumuladas.toFixed(2)}`);

  // 6. Diagnóstico final
  console.log("\n═".repeat(70));
  console.log("\n🎯 DIAGNÓSTICO Y RECOMENDACIONES:\n");

  if (ordenesSinCompra.length > 0) {
    console.log("   ❌ PROBLEMA: Hay órdenes sin registro de compra");
    console.log("   💡 CAUSA: El webhook no creó el registro en la tabla correspondiente");
    console.log("   🔧 SOLUCIÓN: Revisa los logs del webhook para esas órdenes específicas\n");
  }

  if (comprasSinGanancias.length > 0) {
    console.log("   ❌ PROBLEMA: Hay compras sin ganancias calculadas");
    console.log("   💡 CAUSA PROBABLE:");
    console.log("      - instructorId es null o inválido");
    console.log("      - metadata.ticket_price_pence no fue pasado");
    console.log("      - El cálculo de comisiones falló");
    console.log("   🔧 SOLUCIÓN: Ejecuta el script de migración de ganancias\n");
  }

  if (ordenesSinCompra.length === 0 && comprasSinGanancias.length === 0) {
    console.log("   ✅ SISTEMA FUNCIONANDO CORRECTAMENTE");
    console.log("   💡 Todas las órdenes tienen registros de compra y ganancias\n");
  }

  if (ordenesTest.length > 0) {
    console.log("   🧪 NOTA: Hay órdenes de TEST en la base de datos");
    console.log(`   📊 Total: ${ordenesTest.length} órdenes TEST`);
    console.log("   💡 Para verlas en el dashboard, activa el toggle 'Test Mode: ON'\n");
  }

  if (profesoresSinGanancias > 0) {
    console.log(`   ℹ️  INFO: ${profesoresSinGanancias} profesores no tienen ganancias todavía`);
    console.log("   💡 Esto es normal si no han vendido nada aún\n");
  }

  console.log("═".repeat(70));
  console.log("\n📝 PRÓXIMOS PASOS:\n");
  console.log("   1. Reinicia el servidor: npm run dev");
  console.log("   2. Haz una compra de prueba con tarjeta Stripe: 4242 4242 4242 4242");
  console.log("   3. Revisa los logs del servidor para ver:");
  console.log("      [Webhook] 🔍 Processing checkout - Mode: TEST, ...");
  console.log("      [Webhook] ✅ TEST EARNINGS - Instructor receives: £XX.XX");
  console.log("   4. Ve al dashboard /earnings y activa 'Test Mode: ON'");
  console.log("   5. Deberías ver las ganancias inmediatamente\n");

  console.log("═".repeat(70));
  console.log("\n✅ Análisis completado\n");
}

analizarGananciasFaltantes().catch(console.error);
