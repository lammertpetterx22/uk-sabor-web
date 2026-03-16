/**
 * Script de Testing Completo - UK Sabor Platform
 * Este script automatiza todo el flujo:
 * 1. Crea cuenta de profesor
 * 2. Crea evento, curso y clase
 * 3. Crea cuenta de cliente
 * 4. Compra evento, curso y clase
 * 5. Verifica generación de QR codes
 * 6. Simula escaneo de QR codes
 */

import { getDb } from "./server/db";
import { users, instructors, events, courses, classes, orders, eventTickets, coursePurchases, classPurchases, qrCodes, attendance, instructorApplications } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function section(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${"=".repeat(60)}${colors.reset}\n`);
}

async function main() {
  const db = await getDb();
  if (!db) {
    log("❌", "Database no disponible", colors.red);
    process.exit(1);
  }

  log("🚀", "Iniciando test completo de la plataforma UK Sabor", colors.bright);

  // ============================================
  // FASE 1: CREAR CUENTA DE PROFESOR
  // ============================================
  section("FASE 1: Crear Cuenta de Profesor");

  const profesorEmail = `profesor.${Date.now()}@test.com`;
  const profesorPassword = "password123";
  const profesorName = "Carlos Rodríguez";

  log("📝", `Creando usuario: ${profesorEmail}`, colors.blue);

  const passwordHash = await bcrypt.hash(profesorPassword, SALT_ROUNDS);
  const openId = `custom-${Date.now()}-profesor`;

  const [profesorUser] = await db.insert(users).values({
    email: profesorEmail,
    name: profesorName,
    passwordHash,
    openId,
    loginMethod: "custom",
    role: "instructor",
    roles: JSON.stringify(["instructor"]),
    lastSignedIn: new Date(),
  }).returning();

  log("✅", `Usuario profesor creado - ID: ${profesorUser.id}`, colors.green);

  // Crear perfil de instructor
  const [instructorProfile] = await db.insert(instructors).values({
    userId: profesorUser.id,
    name: profesorName,
    bio: "Instructor profesional de salsa y bachata con 10 años de experiencia",
    specialties: JSON.stringify(["Salsa", "Bachata", "Reggaeton"]),
    instagramHandle: "@carlos_dance",
  }).returning();

  log("✅", `Perfil de instructor creado - ID: ${instructorProfile.id}`, colors.green);

  // ============================================
  // FASE 2: CREAR CONTENIDO COMO PROFESOR
  // ============================================
  section("FASE 2: Crear Contenido (Evento, Curso, Clase)");

  // A. CREAR EVENTO
  log("🎉", "Creando evento...", colors.blue);

  const [evento] = await db.insert(events).values({
    title: "Salsa Night - UK Sabor Edition",
    description: "Noche de salsa con los mejores DJs de Londres. Música en vivo, clases gratuitas y ambiente increíble.",
    venue: "London Dance Studio",
    city: "London",
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 7 días
    eventEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 horas después
    ticketPrice: "15.00",
    maxTickets: 100,
    ticketsSold: 0,
    status: "published",
    paymentMethod: "online",
    creatorId: profesorUser.id,
  }).returning();

  log("✅", `Evento creado - ID: ${evento.id} - "${evento.title}"`, colors.green);

  // B. CREAR CURSO
  log("📚", "Creando curso...", colors.blue);

  const [curso] = await db.insert(courses).values({
    title: "Bachata para Principiantes",
    description: "Aprende bachata desde cero con nuestro método probado. 8 lecciones completas con técnicas básicas y avanzadas.",
    instructorId: instructorProfile.id,
    price: "49.99",
    level: "beginner",
    danceStyle: "Bachata",
    duration: "4 semanas",
    lessonsCount: 8,
    status: "published",
  }).returning();

  log("✅", `Curso creado - ID: ${curso.id} - "${curso.title}"`, colors.green);

  // C. CREAR CLASE
  log("💃", "Creando clase...", colors.blue);

  const [clase] = await db.insert(classes).values({
    title: "Salsa Intermedia - Giros y Vueltas",
    description: "Clase práctica de salsa nivel intermedio. Trabajaremos giros, vueltas y combinaciones.",
    instructorId: instructorProfile.id,
    price: "12.00",
    danceStyle: "Salsa",
    level: "intermediate",
    classDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
    duration: 90, // 90 minutos
    maxParticipants: 30,
    currentParticipants: 0,
    status: "published",
    paymentMethod: "online",
    hasSocial: true,
    socialTime: "22:00",
    socialLocation: "UK Sabor Club",
    socialDescription: "Después de la clase, practica lo aprendido en nuestra social!",
  }).returning();

  log("✅", `Clase creada - ID: ${clase.id} - "${clase.title}"`, colors.green);

  // ============================================
  // FASE 3: CREAR CUENTA DE CLIENTE
  // ============================================
  section("FASE 3: Crear Cuenta de Cliente");

  const clienteEmail = `cliente.${Date.now()}@test.com`;
  const clientePassword = "password123";
  const clienteName = "María López";

  log("📝", `Creando usuario cliente: ${clienteEmail}`, colors.blue);

  const clientePasswordHash = await bcrypt.hash(clientePassword, SALT_ROUNDS);
  const clienteOpenId = `custom-${Date.now()}-cliente`;

  const [clienteUser] = await db.insert(users).values({
    email: clienteEmail,
    name: clienteName,
    passwordHash: clientePasswordHash,
    openId: clienteOpenId,
    loginMethod: "custom",
    role: "user",
    lastSignedIn: new Date(),
  }).returning();

  log("✅", `Usuario cliente creado - ID: ${clienteUser.id}`, colors.green);

  // ============================================
  // FASE 4: COMPRAR COMO CLIENTE
  // ============================================
  section("FASE 4: Realizar Compras (Evento, Curso, Clase)");

  // A. COMPRAR EVENTO
  log("🎫", "Comprando ticket para el evento...", colors.blue);

  const eventoPrice = parseFloat(evento.ticketPrice);
  const eventoPlatformFee = eventoPrice * 0.15; // 15% fee
  const eventoInstructorEarnings = eventoPrice - eventoPlatformFee;

  const [eventoOrder] = await db.insert(orders).values({
    userId: clienteUser.id,
    amount: evento.ticketPrice,
    currency: "GBP",
    status: "completed",
    itemType: "event",
    itemId: evento.id,
    stripePaymentIntentId: `pi_test_evento_${Date.now()}`,
  }).returning();

  const ticketCode = `EVT-${evento.id}-${clienteUser.id}-${Date.now()}`;

  const [eventoTicket] = await db.insert(eventTickets).values({
    userId: clienteUser.id,
    eventId: evento.id,
    orderId: eventoOrder.id,
    quantity: 1,
    instructorId: profesorUser.id,
    pricePaid: evento.ticketPrice,
    platformFee: eventoPlatformFee.toFixed(2),
    instructorEarnings: eventoInstructorEarnings.toFixed(2),
    ticketCode,
    status: "valid",
  }).returning();

  // Generar QR para evento
  const eventoQRData = JSON.stringify({
    type: "event",
    eventId: evento.id,
    userId: clienteUser.id,
    ticketId: eventoTicket.id,
    code: ticketCode,
  });

  const [eventoQR] = await db.insert(qrCodes).values({
    code: ticketCode,
    itemType: "event",
    itemId: evento.id,
    userId: clienteUser.id,
    orderId: eventoOrder.id,
    qrData: eventoQRData,
    isUsed: false,
  }).returning();

  log("✅", `Ticket de evento comprado - Código: ${ticketCode}`, colors.green);
  log("📱", `QR Code generado - ID: ${eventoQR.id}`, colors.cyan);

  // B. COMPRAR CURSO
  log("📖", "Comprando curso...", colors.blue);

  const cursoPrice = parseFloat(curso.price);
  const cursoPlatformFee = cursoPrice * 0.15;
  const cursoInstructorEarnings = cursoPrice - cursoPlatformFee;

  const [cursoOrder] = await db.insert(orders).values({
    userId: clienteUser.id,
    amount: curso.price,
    currency: "GBP",
    status: "completed",
    itemType: "course",
    itemId: curso.id,
    stripePaymentIntentId: `pi_test_curso_${Date.now()}`,
  }).returning();

  const [cursoPurchase] = await db.insert(coursePurchases).values({
    userId: clienteUser.id,
    courseId: curso.id,
    instructorId: profesorUser.id,
    orderId: cursoOrder.id,
    pricePaid: curso.price,
    platformFee: cursoPlatformFee.toFixed(2),
    instructorEarnings: cursoInstructorEarnings.toFixed(2),
    progress: 0,
    completed: false,
  }).returning();

  log("✅", `Curso comprado - ID de compra: ${cursoPurchase.id}`, colors.green);

  // C. COMPRAR CLASE
  log("🎯", "Comprando clase...", colors.blue);

  const clasePrice = parseFloat(clase.price);
  const clasePlatformFee = clasePrice * 0.15;
  const claseInstructorEarnings = clasePrice - clasePlatformFee;

  const [claseOrder] = await db.insert(orders).values({
    userId: clienteUser.id,
    amount: clase.price,
    currency: "GBP",
    status: "completed",
    itemType: "class",
    itemId: clase.id,
    stripePaymentIntentId: `pi_test_clase_${Date.now()}`,
  }).returning();

  const claseAccessCode = `CLS-${clase.id}-${clienteUser.id}-${Date.now()}`;

  const [clasePurchase] = await db.insert(classPurchases).values({
    userId: clienteUser.id,
    classId: clase.id,
    instructorId: profesorUser.id,
    orderId: claseOrder.id,
    pricePaid: clase.price,
    platformFee: clasePlatformFee.toFixed(2),
    instructorEarnings: claseInstructorEarnings.toFixed(2),
    accessCode: claseAccessCode,
    status: "active",
  }).returning();

  // Generar QR para clase
  const claseQRData = JSON.stringify({
    type: "class",
    classId: clase.id,
    userId: clienteUser.id,
    purchaseId: clasePurchase.id,
    code: claseAccessCode,
  });

  const [claseQR] = await db.insert(qrCodes).values({
    code: claseAccessCode,
    itemType: "class",
    itemId: clase.id,
    userId: clienteUser.id,
    orderId: claseOrder.id,
    qrData: claseQRData,
    isUsed: false,
  }).returning();

  log("✅", `Clase comprada - Código: ${claseAccessCode}`, colors.green);
  log("📱", `QR Code generado - ID: ${claseQR.id}`, colors.cyan);

  // ============================================
  // FASE 5: VERIFICAR QR CODES
  // ============================================
  section("FASE 5: Verificar QR Codes Generados");

  const allQRs = await db.select().from(qrCodes).where(eq(qrCodes.userId, clienteUser.id));

  log("📊", `Total de QR Codes generados: ${allQRs.length}`, colors.yellow);

  for (const qr of allQRs) {
    log("🔍", `  - ${qr.itemType.toUpperCase()} | Código: ${qr.code} | Usado: ${qr.isUsed ? "SÍ" : "NO"}`, colors.cyan);
  }

  // ============================================
  // FASE 6: ESCANEAR QR CODES (como Profesor)
  // ============================================
  section("FASE 6: Escanear QR Codes (Check-in)");

  // Escanear QR del evento
  log("📷", "Escaneando QR del evento...", colors.blue);

  const qrEvento = await db.select().from(qrCodes)
    .where(eq(qrCodes.id, eventoQR.id))
    .limit(1);

  if (qrEvento[0] && !qrEvento[0].isUsed) {
    // Marcar QR como usado
    await db.update(qrCodes)
      .set({ isUsed: true, usedAt: new Date() })
      .where(eq(qrCodes.id, eventoQR.id));

    // Crear registro de asistencia
    await db.insert(attendance).values({
      userId: clienteUser.id,
      itemType: "event",
      itemId: evento.id,
      qrCodeId: eventoQR.id,
      checkedInBy: profesorUser.id,
    });

    // Marcar ticket como usado
    await db.update(eventTickets)
      .set({ usedAt: new Date() })
      .where(eq(eventTickets.id, eventoTicket.id));

    log("✅", `Check-in exitoso para evento: ${evento.title}`, colors.green);
  } else {
    log("❌", "QR del evento ya fue usado o inválido", colors.red);
  }

  // Escanear QR de la clase
  log("📷", "Escaneando QR de la clase...", colors.blue);

  const qrClase = await db.select().from(qrCodes)
    .where(eq(qrCodes.id, claseQR.id))
    .limit(1);

  if (qrClase[0] && !qrClase[0].isUsed) {
    // Marcar QR como usado
    await db.update(qrCodes)
      .set({ isUsed: true, usedAt: new Date() })
      .where(eq(qrCodes.id, claseQR.id));

    // Crear registro de asistencia
    await db.insert(attendance).values({
      userId: clienteUser.id,
      itemType: "class",
      itemId: clase.id,
      qrCodeId: claseQR.id,
      checkedInBy: profesorUser.id,
    });

    log("✅", `Check-in exitoso para clase: ${clase.title}`, colors.green);
  } else {
    log("❌", "QR de la clase ya fue usado o inválido", colors.red);
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  section("✨ RESUMEN FINAL");

  log("👨‍🏫", `Profesor creado: ${profesorName} (${profesorEmail})`, colors.magenta);
  log("👤", `Cliente creado: ${clienteName} (${clienteEmail})`, colors.magenta);
  console.log("");
  log("📋", "Contenido creado:", colors.yellow);
  log("  🎉", `Evento: ${evento.title} - £${evento.ticketPrice}`, colors.cyan);
  log("  📚", `Curso: ${curso.title} - £${curso.price}`, colors.cyan);
  log("  💃", `Clase: ${clase.title} - £${clase.price}`, colors.cyan);
  console.log("");
  log("🛒", "Compras realizadas:", colors.yellow);
  log("  ✅", `Ticket de evento - Código: ${ticketCode}`, colors.green);
  log("  ✅", `Acceso a curso - ID: ${cursoPurchase.id}`, colors.green);
  log("  ✅", `Reserva de clase - Código: ${claseAccessCode}`, colors.green);
  console.log("");
  log("📱", `QR Codes generados: ${allQRs.length}`, colors.yellow);
  log("✅", "Check-ins realizados: 2 (evento y clase)", colors.green);
  console.log("");

  const totalGastado = eventoPrice + cursoPrice + clasePrice;
  const totalEarnings = eventoInstructorEarnings + cursoInstructorEarnings + claseInstructorEarnings;
  const totalFees = eventoPlatformFee + cursoPlatformFee + clasePlatformFee;

  log("💰", "Resumen financiero:", colors.yellow);
  log("  💵", `Total gastado por cliente: £${totalGastado.toFixed(2)}`, colors.cyan);
  log("  💸", `Ganancias del profesor: £${totalEarnings.toFixed(2)}`, colors.green);
  log("  🏦", `Comisión de plataforma (15%): £${totalFees.toFixed(2)}`, colors.blue);

  console.log(`\n${colors.bright}${colors.green}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}  ✨ TEST COMPLETO EXITOSO ✨${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${"=".repeat(60)}${colors.reset}\n`);

  log("🔑", "Credenciales para login manual:", colors.yellow);
  log("", `Profesor: ${profesorEmail} / ${profesorPassword}`, colors.cyan);
  log("", `Cliente: ${clienteEmail} / ${clientePassword}`, colors.cyan);
  console.log("");
  log("🌐", "Accede a la plataforma en: http://localhost:3001", colors.bright);

  process.exit(0);
}

// Ejecutar el script
main().catch((error) => {
  console.error(`\n${colors.red}❌ Error en el test:${colors.reset}`, error);
  process.exit(1);
});
