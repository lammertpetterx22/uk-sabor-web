#!/usr/bin/env npx tsx
/**
 * Investigar las compras de Sara Bartosova y por qué no le aparecen ganancias
 */

import { getDb } from "../server/db";
import { orders, coursePurchases, courses, instructors, users, balances, ledgerTransactions } from "../drizzle/schema";
import { eq, desc, like, or } from "drizzle-orm";

async function investigarSaraBartosova() {
  console.log("🔍 INVESTIGANDO COMPRAS DE SARA BARTOSOVA\n");
  console.log("═".repeat(70));

  const db = await getDb();
  if (!db) {
    console.error("❌ Base de datos no disponible");
    return;
  }

  // 1. Buscar a Sara Bartosova en usuarios
  console.log("\n📊 PASO 1: Buscando a Sara Bartosova en usuarios...\n");

  const usuariosSara = await db
    .select()
    .from(users)
    .where(
      or(
        like(users.name, '%Sara%'),
        like(users.name, '%Bartosova%'),
        like(users.email, '%sara%'),
        like(users.email, '%bartosova%')
      )
    );

  if (usuariosSara.length === 0) {
    console.log("   ❌ No se encontró usuario con nombre 'Sara Bartosova'");
  } else {
    console.log(`   ✅ Encontrados ${usuariosSara.length} usuario(s):\n`);
    for (const user of usuariosSara) {
      console.log(`      Usuario ID: ${user.id}`);
      console.log(`      Nombre: ${user.name}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Rol: ${user.role}`);
      console.log(`      Plan: ${user.subscriptionPlan}`);
      console.log("");
    }
  }

  // 2. Buscar en instructores
  console.log("📊 PASO 2: Buscando a Sara Bartosova en instructores...\n");

  const instructoresSara = await db
    .select()
    .from(instructors)
    .where(
      or(
        like(instructors.name, '%Sara%'),
        like(instructors.name, '%Bartosova%')
      )
    );

  if (instructoresSara.length === 0) {
    console.log("   ❌ No se encontró instructor con nombre 'Sara Bartosova'");
  } else {
    console.log(`   ✅ Encontrados ${instructoresSara.length} instructor(es):\n`);
    for (const instructor of instructoresSara) {
      console.log(`      Instructor ID: ${instructor.id}`);
      console.log(`      Nombre: ${instructor.name}`);
      console.log(`      Usuario ID: ${instructor.userId || 'NO ASIGNADO ❌'}`);
      console.log(`      Instagram: ${instructor.instagramHandle || 'N/A'}`);
      console.log("");
    }
  }

  // 3. Buscar cursos de Sara
  console.log("📊 PASO 3: Buscando cursos de Sara Bartosova...\n");

  const cursosSara: any[] = [];

  if (instructoresSara.length > 0) {
    for (const instructor of instructoresSara) {
      const cursosInstructor = await db
        .select()
        .from(courses)
        .where(eq(courses.instructorId, instructor.id));

      cursosSara.push(...cursosInstructor);
    }
  }

  if (cursosSara.length === 0) {
    console.log("   ⚠️  No se encontraron cursos de Sara Bartosova");
  } else {
    console.log(`   ✅ Encontrados ${cursosSara.length} curso(s):\n`);
    for (const curso of cursosSara) {
      console.log(`      Curso ID: ${curso.id}`);
      console.log(`      Título: ${curso.title}`);
      console.log(`      Instructor ID: ${curso.instructorId}`);
      console.log(`      Precio: £${curso.price || 0}`);
      console.log(`      Estado: ${curso.status}`);
      console.log("");
    }
  }

  // 4. Buscar compras de los cursos de Sara
  console.log("📊 PASO 4: Buscando compras de cursos de Sara...\n");

  const comprasCursosSara: any[] = [];
  const cursoIds = cursosSara.map(c => c.id);

  if (cursoIds.length > 0) {
    for (const cursoId of cursoIds) {
      const compras = await db
        .select()
        .from(coursePurchases)
        .where(eq(coursePurchases.courseId, cursoId))
        .orderBy(desc(coursePurchases.purchasedAt));

      comprasCursosSara.push(...compras);
    }
  }

  if (comprasCursosSara.length === 0) {
    console.log("   ⚠️  No se encontraron compras de cursos de Sara");
  } else {
    console.log(`   ✅ Encontradas ${comprasCursosSara.length} compra(s):\n`);
    for (const compra of comprasCursosSara) {
      console.log(`      Compra ID: ${compra.id}`);
      console.log(`      Curso ID: ${compra.courseId}`);
      console.log(`      Orden ID: ${compra.orderId}`);
      console.log(`      Usuario comprador ID: ${compra.userId}`);
      console.log(`      Instructor ID: ${compra.instructorId || 'NO ASIGNADO ❌'}`);
      console.log(`      Precio pagado: £${compra.pricePaid || 'N/A'}`);
      console.log(`      Comisión plataforma: £${compra.platformFee || 'N/A'}`);
      console.log(`      Ganancias instructor: £${compra.instructorEarnings || 'N/A'}`);
      console.log(`      Fecha: ${compra.purchasedAt}`);
      console.log("");
    }
  }

  // 5. Buscar órdenes relacionadas con los cursos de Sara
  console.log("📊 PASO 5: Buscando órdenes relacionadas...\n");

  const ordenIds = comprasCursosSara.map(c => c.orderId).filter(Boolean);

  if (ordenIds.length > 0) {
    for (const ordenId of ordenIds) {
      const [orden] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, ordenId!));

      if (orden) {
        console.log(`      Orden #${orden.id}`);
        console.log(`         Monto: £${orden.amount}`);
        console.log(`         Estado: ${orden.status}`);
        console.log(`         Modo: ${orden.livemode ? 'LIVE 💰' : 'TEST 🧪'}`);
        console.log(`         Fecha: ${orden.createdAt}`);
        console.log("");
      }
    }
  }

  // 6. Verificar balance de Sara
  console.log("📊 PASO 6: Verificando balance de Sara...\n");

  if (instructoresSara.length > 0 && instructoresSara[0].userId) {
    const userId = instructoresSara[0].userId;
    const [balance] = await db
      .select()
      .from(balances)
      .where(eq(balances.userId, userId));

    if (!balance) {
      console.log(`   ❌ Sara NO tiene balance creado (userId: ${userId})`);
    } else {
      console.log(`   ✅ Balance de Sara (userId: ${userId}):\n`);
      console.log(`      Balance actual: £${balance.currentBalance}`);
      console.log(`      Balance pendiente: £${balance.pendingBalance}`);
      console.log(`      Total ganado: £${balance.totalEarned}`);
      console.log(`      Total retirado: £${balance.totalWithdrawn}`);
      console.log("");

      // Ver transacciones en el ledger
      const transacciones = await db
        .select()
        .from(ledgerTransactions)
        .where(eq(ledgerTransactions.userId, userId))
        .orderBy(desc(ledgerTransactions.createdAt));

      if (transacciones.length === 0) {
        console.log("      ⚠️  No hay transacciones en el ledger");
      } else {
        console.log(`      📒 Transacciones en ledger (${transacciones.length}):\n`);
        for (const tx of transacciones) {
          console.log(`         ${tx.type.toUpperCase()}: ${tx.description}`);
          console.log(`         Monto: £${tx.amount} | Estado: ${tx.status}`);
          console.log(`         Fecha: ${tx.createdAt}`);
          console.log("");
        }
      }
    }
  }

  // 7. DIAGNÓSTICO FINAL
  console.log("═".repeat(70));
  console.log("\n🎯 DIAGNÓSTICO:\n");

  const instructor = instructoresSara[0];
  const usuario = usuariosSara[0];

  if (!instructor) {
    console.log("   ❌ PROBLEMA: Sara Bartosova NO existe como instructor");
    console.log("   🔧 SOLUCIÓN: Crea el registro de instructor para Sara\n");
    return;
  }

  if (!instructor.userId) {
    console.log("   ❌ PROBLEMA: El instructor Sara Bartosova NO tiene userId asignado");
    console.log(`   📋 Instructor ID: ${instructor.id}`);
    console.log("   🔧 SOLUCIÓN: Asignar un userId al instructor Sara Bartosova\n");

    if (usuario) {
      console.log(`   💡 Usuario encontrado: ${usuario.name} (ID: ${usuario.id})`);
      console.log(`   🔧 Ejecutar: UPDATE instructors SET "userId" = ${usuario.id} WHERE id = ${instructor.id};\n`);
    } else {
      console.log("   💡 Necesitas crear un usuario para Sara primero\n");
    }
    return;
  }

  if (cursosSara.length === 0) {
    console.log("   ⚠️  Sara no tiene cursos asignados");
    console.log("   💡 Verifica que los cursos tengan instructorId correcto\n");
    return;
  }

  if (comprasCursosSara.length === 0) {
    console.log("   ⚠️  No hay compras de los cursos de Sara");
    console.log("   💡 La compra que hiciste podría estar asociada a otro curso\n");
    return;
  }

  // Verificar si las compras tienen ganancias
  const comprasSinGanancias = comprasCursosSara.filter(c =>
    !c.instructorEarnings || parseFloat(String(c.instructorEarnings)) === 0
  );

  if (comprasSinGanancias.length > 0) {
    console.log(`   ❌ PROBLEMA: ${comprasSinGanancias.length} compra(s) sin ganancias calculadas`);
    console.log("   💡 CAUSA: El webhook no calculó las ganancias correctamente");
    console.log("   🔧 SOLUCIÓN: Necesito recalcular las ganancias manualmente\n");

    for (const compra of comprasSinGanancias) {
      console.log(`      Compra #${compra.id} - Orden #${compra.orderId}`);
    }
    console.log("");
  }

  if (usuario && !usuario.id) {
    console.log("   ❌ PROBLEMA: Usuario sin ID válido");
    return;
  }

  const userId = instructor.userId;
  const [balance] = await db.select().from(balances).where(eq(balances.userId, userId));

  if (!balance) {
    console.log(`   ❌ PROBLEMA: Sara no tiene balance creado (userId: ${userId})`);
    console.log("   🔧 SOLUCIÓN: Crear balance automáticamente al recalcular ganancias\n");
  } else if (parseFloat(String(balance.totalEarned)) === 0) {
    console.log("   ❌ PROBLEMA: El balance existe pero totalEarned = £0");
    console.log("   💡 Las ganancias no se registraron en el balance");
    console.log("   🔧 SOLUCIÓN: Recalcular y registrar las ganancias\n");
  }

  console.log("═".repeat(70));
  console.log("\n📝 SIGUIENTE PASO:\n");
  console.log("   Voy a arreglar este problema automáticamente...\n");
}

investigarSaraBartosova().catch(console.error);
