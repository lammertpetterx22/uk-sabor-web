/**
 * Script de Testing en PRODUCCIÓN - UK Sabor Platform
 * ⚠️ EJECUTA EN LA BASE DE DATOS LIVE
 *
 * Este script automatiza todo el flujo EN PRODUCCIÓN:
 * 1. Crea cuenta de profesor
 * 2. Crea evento, curso y clase
 * 3. Crea cuenta de cliente
 * 4. Compra evento, curso y clase
 * 5. Verifica generación de QR codes
 * 6. Simula escaneo de QR codes
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, instructors, events, courses, classes, orders, eventTickets, coursePurchases, classPurchases, qrCodes, attendance } from "./drizzle/schema";
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
  // Conectar a la base de datos de PRODUCCIÓN
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    log("❌", "DATABASE_URL no configurada", colors.red);
    process.exit(1);
  }

  log("🔗", "Conectando a base de datos de PRODUCCIÓN...", colors.yellow);
  log("⚠️", "ADVERTENCIA: Este script modificará la base de datos LIVE", colors.red);

  const sql = postgres(DATABASE_URL);
  const db = drizzle(sql);

  log("✅", "Conexión establecida con base de datos de producción", colors.green);

  log("🚀", "Iniciando test completo en PRODUCCIÓN - UK Sabor", colors.bright);

  // ============================================
  // FASE 1: CREAR CUENTA DE PROFESOR
  // ============================================
  section("FASE 1: Crear Cuenta de Profesor EN PRODUCCIÓN");

  const timestamp = Date.now();
  const profesorEmail = `profesor.live.${timestamp}@uksabor.com`;
  const profesorPassword = "UKSabor2026!";
  const profesorName = "Carlos Rodríguez";

  log("📝", `Creando usuario: ${profesorEmail}`, colors.blue);

  const passwordHash = await bcrypt.hash(profesorPassword, SALT_ROUNDS);
  const openId = `custom-live-${timestamp}-profesor`;

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
    bio: "Instructor profesional de salsa y bachata con 10 años de experiencia. Campeón nacional de baile latino.",
    specialties: JSON.stringify(["Salsa", "Bachata", "Reggaeton", "Kizomba"]),
    instagramHandle: "@carlos_uksabor",
    websiteUrl: "https://uk-sabor-web.onrender.com",
  }).returning();

  log("✅", `Perfil de instructor creado - ID: ${instructorProfile.id}`, colors.green);

  // ============================================
  // FASE 2: CREAR CONTENIDO COMO PROFESOR
  // ============================================
  section("FASE 2: Crear Contenido EN PRODUCCIÓN (Evento, Curso, Clase)");

  // A. CREAR EVENTO
  log("🎉", "Creando evento en LIVE...", colors.blue);

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14); // En 2 semanas
  const eventEndDate = new Date(eventDate);
  eventEndDate.setHours(eventEndDate.getHours() + 5);

  const [evento] = await db.insert(events).values({
    title: "🔥 UK Sabor Mega Event - Salsa & Bachata Night",
    description: `¡La fiesta latina más grande de Londres!

🎵 DJ Internacional en vivo
💃 Clases gratuitas con instructores profesionales
🍹 Barra de cócteles especiales
🎁 Sorteos y premios
✨ Ambiente increíble garantizado

No te pierdas este evento espectacular. ¡Cupos limitados!`,
    venue: "Ministry of Sound - London",
    city: "London",
    eventDate,
    eventEndDate,
    ticketPrice: "18.50",
    maxTickets: 200,
    ticketsSold: 0,
    status: "published",
    paymentMethod: "online",
    creatorId: profesorUser.id,
    imageUrl: "https://uk-sabor.b-cdn.net/events/salsa-night.jpg",
  }).returning();

  log("✅", `Evento LIVE creado - ID: ${evento.id} - "${evento.title}"`, colors.green);

  // B. CREAR CURSO
  log("📚", "Creando curso en LIVE...", colors.blue);

  const [curso] = await db.insert(courses).values({
    title: "🎓 Bachata Sensual - De Cero a Profesional",
    description: `Aprende bachata sensual desde cero con el método más efectivo de UK.

📌 Lo que aprenderás:
• Fundamentos y técnica base
• Giros y vueltas profesionales
• Conexión y musicalidad
• Secuencias coreográficas
• Estilo y expresión corporal

✅ Incluye:
• 12 lecciones en video HD
• Material descargable
• Acceso de por vida
• Certificado de finalización
• Soporte del instructor

Perfecto para principiantes y nivel intermedio.`,
    instructorId: instructorProfile.id,
    price: "79.99",
    level: "beginner",
    danceStyle: "Bachata",
    duration: "6 semanas",
    lessonsCount: 12,
    status: "published",
    imageUrl: "https://uk-sabor.b-cdn.net/courses/bachata-sensual.jpg",
  }).returning();

  log("✅", `Curso LIVE creado - ID: ${curso.id} - "${curso.title}"`, colors.green);

  // C. CREAR CLASE
  log("💃", "Creando clase en LIVE...", colors.blue);

  const classDate = new Date();
  classDate.setDate(classDate.getDate() + 5); // En 5 días
  classDate.setHours(19, 0, 0, 0); // 7:00 PM

  const [clase] = await db.insert(classes).values({
    title: "🌟 Salsa Intermedia - Shines & Footwork",
    description: `Clase intensiva de salsa nivel intermedio enfocada en shines y trabajo de pies.

🎯 En esta clase trabajaremos:
• Técnica avanzada de pies
• Shines básicos e intermedios
• Coordinación y musicalidad
• Combinaciones de pasos
• Estilo y presencia escénica

👥 Máximo 25 personas para atención personalizada
⏰ 90 minutos de clase intensiva
🎉 Social gratuita después de la clase

¡Ideal para mejorar tu técnica y estilo!`,
    instructorId: instructorProfile.id,
    price: "14.50",
    danceStyle: "Salsa",
    level: "intermediate",
    classDate,
    duration: 90,
    maxParticipants: 25,
    currentParticipants: 0,
    status: "published",
    paymentMethod: "online",
    hasSocial: true,
    socialTime: "21:00",
    socialLocation: "UK Sabor Dance Club - Shoreditch",
    socialDescription: "¡Practica todo lo aprendido en nuestra social! Música en vivo, ambiente increíble y muchas ganas de bailar. Entrada gratuita para estudiantes de la clase.",
    imageUrl: "https://uk-sabor.b-cdn.net/classes/salsa-shines.jpg",
  }).returning();

  log("✅", `Clase LIVE creada - ID: ${clase.id} - "${clase.title}"`, colors.green);

  // ============================================
  // FASE 3: CREAR CUENTA DE CLIENTE
  // ============================================
  section("FASE 3: Crear Cuenta de Cliente EN PRODUCCIÓN");

  const clienteEmail = `cliente.live.${timestamp}@uksabor.com`;
  const clientePassword = "UKSabor2026!";
  const clienteName = "María López García";

  log("📝", `Creando usuario cliente: ${clienteEmail}`, colors.blue);

  const clientePasswordHash = await bcrypt.hash(clientePassword, SALT_ROUNDS);
  const clienteOpenId = `custom-live-${timestamp}-cliente`;

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
  section("FASE 4: Realizar Compras EN PRODUCCIÓN (Evento, Curso, Clase)");

  // A. COMPRAR EVENTO
  log("🎫", "Comprando ticket para el evento en LIVE...", colors.blue);

  const eventoPrice = parseFloat(evento.ticketPrice);
  const eventoPlatformFee = eventoPrice * 0.15;
  const eventoInstructorEarnings = eventoPrice - eventoPlatformFee;

  const [eventoOrder] = await db.insert(orders).values({
    userId: clienteUser.id,
    amount: evento.ticketPrice,
    currency: "GBP",
    status: "completed",
    itemType: "event",
    itemId: evento.id,
    stripePaymentIntentId: `pi_live_test_evento_${timestamp}`,
  }).returning();

  const ticketCode = `EVT-LIVE-${evento.id}-${clienteUser.id}-${timestamp}`;

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

  const eventoQRData = JSON.stringify({
    type: "event",
    eventId: evento.id,
    userId: clienteUser.id,
    ticketId: eventoTicket.id,
    code: ticketCode,
    timestamp,
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

  log("✅", `Ticket LIVE comprado - Código: ${ticketCode}`, colors.green);
  log("📱", `QR Code LIVE generado - ID: ${eventoQR.id}`, colors.cyan);

  // B. COMPRAR CURSO
  log("📖", "Comprando curso en LIVE...", colors.blue);

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
    stripePaymentIntentId: `pi_live_test_curso_${timestamp}`,
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

  log("✅", `Curso LIVE comprado - ID: ${cursoPurchase.id}`, colors.green);

  // C. COMPRAR CLASE
  log("🎯", "Comprando clase en LIVE...", colors.blue);

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
    stripePaymentIntentId: `pi_live_test_clase_${timestamp}`,
  }).returning();

  const claseAccessCode = `CLS-LIVE-${clase.id}-${clienteUser.id}-${timestamp}`;

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

  const claseQRData = JSON.stringify({
    type: "class",
    classId: clase.id,
    userId: clienteUser.id,
    purchaseId: clasePurchase.id,
    code: claseAccessCode,
    timestamp,
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

  log("✅", `Clase LIVE comprada - Código: ${claseAccessCode}`, colors.green);
  log("📱", `QR Code LIVE generado - ID: ${claseQR.id}`, colors.cyan);

  // ============================================
  // FASE 5: VERIFICAR QR CODES
  // ============================================
  section("FASE 5: Verificar QR Codes en PRODUCCIÓN");

  const allQRs = await db.select().from(qrCodes).where(eq(qrCodes.userId, clienteUser.id));

  log("📊", `Total de QR Codes en LIVE: ${allQRs.length}`, colors.yellow);

  for (const qr of allQRs) {
    log("🔍", `  - ${qr.itemType.toUpperCase()} | Código: ${qr.code} | Usado: ${qr.isUsed ? "SÍ" : "NO"}`, colors.cyan);
  }

  // ============================================
  // FASE 6: ESCANEAR QR CODES
  // ============================================
  section("FASE 6: Escanear QR Codes en PRODUCCIÓN (Check-in)");

  // Escanear QR del evento
  log("📷", "Escaneando QR del evento en LIVE...", colors.blue);

  const qrEvento = await db.select().from(qrCodes)
    .where(eq(qrCodes.id, eventoQR.id))
    .limit(1);

  if (qrEvento[0] && !qrEvento[0].isUsed) {
    await db.update(qrCodes)
      .set({ isUsed: true, usedAt: new Date() })
      .where(eq(qrCodes.id, eventoQR.id));

    await db.insert(attendance).values({
      userId: clienteUser.id,
      itemType: "event",
      itemId: evento.id,
      qrCodeId: eventoQR.id,
      checkedInBy: profesorUser.id,
    });

    await db.update(eventTickets)
      .set({ usedAt: new Date() })
      .where(eq(eventTickets.id, eventoTicket.id));

    log("✅", `Check-in LIVE exitoso para evento: ${evento.title}`, colors.green);
  } else {
    log("❌", "QR del evento ya fue usado o inválido", colors.red);
  }

  // Escanear QR de la clase
  log("📷", "Escaneando QR de la clase en LIVE...", colors.blue);

  const qrClase = await db.select().from(qrCodes)
    .where(eq(qrCodes.id, claseQR.id))
    .limit(1);

  if (qrClase[0] && !qrClase[0].isUsed) {
    await db.update(qrCodes)
      .set({ isUsed: true, usedAt: new Date() })
      .where(eq(qrCodes.id, claseQR.id));

    await db.insert(attendance).values({
      userId: clienteUser.id,
      itemType: "class",
      itemId: clase.id,
      qrCodeId: claseQR.id,
      checkedInBy: profesorUser.id,
    });

    log("✅", `Check-in LIVE exitoso para clase: ${clase.title}`, colors.green);
  } else {
    log("❌", "QR de la clase ya fue usado o inválido", colors.red);
  }

  // Actualizar contador de ventas del evento
  await db.update(events)
    .set({ ticketsSold: (evento.ticketsSold || 0) + 1 })
    .where(eq(events.id, evento.id));

  // Actualizar contador de participantes de la clase
  await db.update(classes)
    .set({ currentParticipants: (clase.currentParticipants || 0) + 1 })
    .where(eq(classes.id, clase.id));

  // ============================================
  // RESUMEN FINAL
  // ============================================
  section("✨ RESUMEN FINAL - PRODUCCIÓN LIVE");

  log("🌍", "DATOS CREADOS EN PRODUCCIÓN (LIVE DATABASE)", colors.bright);
  console.log("");
  log("👨‍🏫", `Profesor: ${profesorName} (${profesorEmail})`, colors.magenta);
  log("👤", `Cliente: ${clienteName} (${clienteEmail})`, colors.magenta);
  console.log("");
  log("📋", "Contenido publicado en LIVE:", colors.yellow);
  log("  🎉", `Evento: ${evento.title}`, colors.cyan);
  log("      ", `Fecha: ${evento.eventDate.toLocaleDateString('es-ES')}`, colors.cyan);
  log("      ", `Precio: £${evento.ticketPrice}`, colors.cyan);
  log("  📚", `Curso: ${curso.title}`, colors.cyan);
  log("      ", `Precio: £${curso.price} | ${curso.lessonsCount} lecciones`, colors.cyan);
  log("  💃", `Clase: ${clase.title}`, colors.cyan);
  log("      ", `Fecha: ${clase.classDate.toLocaleDateString('es-ES')} a las ${clase.classDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, colors.cyan);
  log("      ", `Precio: £${clase.price}`, colors.cyan);
  console.log("");
  log("🛒", "Compras en LIVE:", colors.yellow);
  log("  ✅", `Ticket: ${ticketCode}`, colors.green);
  log("  ✅", `Curso ID: ${cursoPurchase.id}`, colors.green);
  log("  ✅", `Clase: ${claseAccessCode}`, colors.green);
  console.log("");
  log("📱", `QR Codes: ${allQRs.length}`, colors.yellow);
  log("✅", "Check-ins: 2 (evento y clase)", colors.green);
  console.log("");

  const totalGastado = eventoPrice + cursoPrice + clasePrice;
  const totalEarnings = eventoInstructorEarnings + cursoInstructorEarnings + claseInstructorEarnings;
  const totalFees = eventoPlatformFee + cursoPlatformFee + clasePlatformFee;

  log("💰", "Resumen financiero:", colors.yellow);
  log("  💵", `Total: £${totalGastado.toFixed(2)}`, colors.cyan);
  log("  💸", `Profesor: £${totalEarnings.toFixed(2)} (85%)`, colors.green);
  log("  🏦", `Plataforma: £${totalFees.toFixed(2)} (15%)`, colors.blue);

  console.log(`\n${colors.bright}${colors.green}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}  ✨ TEST EN PRODUCCIÓN COMPLETADO ✨${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${"=".repeat(60)}${colors.reset}\n`);

  log("🔑", "CREDENCIALES PARA LOGIN EN PRODUCCIÓN:", colors.bright);
  console.log("");
  log("👨‍🏫", "CUENTA DE PROFESOR:", colors.yellow);
  log("", `  Email: ${profesorEmail}`, colors.cyan);
  log("", `  Password: ${profesorPassword}`, colors.cyan);
  console.log("");
  log("👤", "CUENTA DE CLIENTE:", colors.yellow);
  log("", `  Email: ${clienteEmail}`, colors.cyan);
  log("", `  Password: ${clientePassword}`, colors.cyan);
  console.log("");
  log("🌐", "URL DE PRODUCCIÓN: https://uk-sabor-web.onrender.com", colors.bright);
  console.log("");
  log("📍", "URLs directas:", colors.yellow);
  log("", `  Evento: https://uk-sabor-web.onrender.com/events/${evento.id}`, colors.cyan);
  log("", `  Curso: https://uk-sabor-web.onrender.com/courses/${curso.id}`, colors.cyan);
  log("", `  Clase: https://uk-sabor-web.onrender.com/classes/${clase.id}`, colors.cyan);
  log("", `  Panel Admin: https://uk-sabor-web.onrender.com/admin`, colors.cyan);
  log("", `  Scanner: https://uk-sabor-web.onrender.com/staff/scanner`, colors.cyan);

  await sql.end();
  process.exit(0);
}

main().catch((error) => {
  console.error(`\n${colors.red}❌ Error en el test de producción:${colors.reset}`, error);
  process.exit(1);
});
