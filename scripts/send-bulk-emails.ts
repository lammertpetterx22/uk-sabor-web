// Script para enviar emails masivos a una lista de contactos
import { Resend } from "resend";
import { config } from "dotenv";

config();

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// CONFIGURACIÓN DEL EMAIL
// ============================================================================

const EMAIL_CONFIG = {
  from: "UK Sabor <noreply@consabor.uk>",
  subject: "🎉 ¡Bienvenido a UK Sabor!",

  // Plantilla HTML del email
  htmlTemplate: (name: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ¡Hola ${name}!</h1>
        </div>
        <div class="content">
          <p>¡Bienvenido a <strong>UK Sabor</strong>!</p>

          <p>Estamos emocionados de tenerte con nosotros. UK Sabor es tu destino para:</p>

          <ul>
            <li>🎭 <strong>Eventos culturales increíbles</strong></li>
            <li>💃 <strong>Clases de baile y más</strong></li>
            <li>📚 <strong>Cursos especializados</strong></li>
          </ul>

          <p>Explora nuestra plataforma y descubre todo lo que tenemos para ti:</p>

          <center>
            <a href="https://www.consabor.uk/events" class="button">
              Ver Eventos
            </a>
          </center>

          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

          <p>¡Nos vemos pronto!</p>

          <p><strong>El equipo de UK Sabor</strong></p>
        </div>
        <div class="footer">
          <p>UK Sabor | www.consabor.uk</p>
          <p>Si no deseas recibir más emails, responde con "UNSUBSCRIBE"</p>
        </div>
      </body>
    </html>
  `,

  // Plantilla de texto plano (para clientes que no soportan HTML)
  textTemplate: (name: string) => `
Hola ${name}!

¡Bienvenido a UK Sabor!

Estamos emocionados de tenerte con nosotros. UK Sabor es tu destino para:

- Eventos culturales increíbles
- Clases de baile y más
- Cursos especializados

Visita nuestra plataforma: https://www.consabor.uk/events

Si tienes alguna pregunta, no dudes en contactarnos.

¡Nos vemos pronto!

El equipo de UK Sabor
www.consabor.uk
  `
};

// ============================================================================
// LISTA DE CONTACTOS
// ============================================================================

interface Contact {
  email: string;
  name: string;
}

// IMPORTANTE: Reemplaza esta lista con tu base de datos
const CONTACTS: Contact[] = [
  // EJEMPLO - Reemplaza con tus contactos reales:
  // { email: "usuario1@example.com", name: "Juan Pérez" },
  // { email: "usuario2@example.com", name: "María García" },
  // { email: "usuario3@example.com", name: "Carlos López" },
];

// ============================================================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================================================

const SAFETY_CONFIG = {
  // Límite de emails por ejecución (para evitar enviar demasiados por error)
  maxEmailsPerRun: 100,

  // Delay entre cada email (en milisegundos) para no sobrecargar Resend
  delayBetweenEmails: 1000, // 1 segundo

  // Modo test: Si es true, NO enviará emails reales (solo mostrará lo que haría)
  testMode: true,

  // En test mode, enviar solo a estos emails (para probar)
  testEmails: ["petterlammert@gmail.com"], // Cambia esto a tu email
};

// ============================================================================
// FUNCIONES
// ============================================================================

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmailToContact(contact: Contact): Promise<boolean> {
  try {
    console.log(`\n📧 Enviando email a: ${contact.email} (${contact.name})`);

    if (SAFETY_CONFIG.testMode) {
      console.log(`   ⚠️  TEST MODE - No se enviará email real`);
      console.log(`   Subject: ${EMAIL_CONFIG.subject}`);
      console.log(`   From: ${EMAIL_CONFIG.from}`);
      return true;
    }

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: contact.email,
      subject: EMAIL_CONFIG.subject,
      html: EMAIL_CONFIG.htmlTemplate(contact.name),
      text: EMAIL_CONFIG.textTemplate(contact.name),
    });

    if (result.error) {
      console.error(`   ❌ Error: ${result.error.message}`);
      return false;
    }

    if (result.data) {
      console.log(`   ✅ Enviado exitosamente! ID: ${result.data.id}`);
      return true;
    }

    console.log(`   ⚠️  Respuesta inesperada`);
    return false;

  } catch (error) {
    console.error(`   ❌ Error enviando a ${contact.email}:`, error);
    return false;
  }
}

async function sendBulkEmails() {
  console.log("\n" + "=".repeat(70));
  console.log("📨 ENVÍO MASIVO DE EMAILS - UK SABOR");
  console.log("=".repeat(70));

  // Validaciones
  if (!process.env.RESEND_API_KEY) {
    console.error("\n❌ ERROR: RESEND_API_KEY no está configurado en .env");
    return;
  }

  if (CONTACTS.length === 0) {
    console.error("\n❌ ERROR: No hay contactos en la lista CONTACTS");
    console.log("\n💡 Agrega contactos al array CONTACTS en este script:");
    console.log('   { email: "usuario@example.com", name: "Nombre Apellido" }');
    return;
  }

  // Test mode warning
  if (SAFETY_CONFIG.testMode) {
    console.log("\n⚠️  MODO TEST ACTIVADO");
    console.log("   No se enviarán emails reales.");
    console.log("   Para enviar emails reales, cambia testMode a false");
    console.log("");
  }

  // Safety limit
  let contactsToProcess = CONTACTS;

  if (SAFETY_CONFIG.testMode) {
    // En test mode, solo procesar emails de prueba
    contactsToProcess = CONTACTS.filter(c =>
      SAFETY_CONFIG.testEmails.includes(c.email)
    );

    if (contactsToProcess.length === 0) {
      console.log("\n⚠️  TEST MODE: No hay contactos que coincidan con testEmails");
      console.log("   Usando los primeros 3 contactos para demostración:");
      contactsToProcess = CONTACTS.slice(0, 3);
    }
  } else {
    // En modo real, aplicar límite de seguridad
    if (contactsToProcess.length > SAFETY_CONFIG.maxEmailsPerRun) {
      console.log(`\n⚠️  LÍMITE DE SEGURIDAD: Solo se enviarán ${SAFETY_CONFIG.maxEmailsPerRun} emails`);
      console.log(`   Total en la lista: ${CONTACTS.length}`);
      console.log(`   Para enviar más, ajusta maxEmailsPerRun en SAFETY_CONFIG`);
      contactsToProcess = CONTACTS.slice(0, SAFETY_CONFIG.maxEmailsPerRun);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Total de contactos: ${CONTACTS.length}`);
  console.log(`   A procesar en esta ejecución: ${contactsToProcess.length}`);
  console.log(`   Subject: ${EMAIL_CONFIG.subject}`);
  console.log(`   From: ${EMAIL_CONFIG.from}`);
  console.log(`   Delay entre emails: ${SAFETY_CONFIG.delayBetweenEmails}ms`);

  // Confirmación en modo real
  if (!SAFETY_CONFIG.testMode) {
    console.log("\n⚠️  ¡ATENCIÓN! Esto enviará emails REALES.");
    console.log("   Presiona Ctrl+C en los próximos 5 segundos para cancelar...");
    await sleep(5000);
  }

  console.log("\n" + "=".repeat(70));
  console.log("🚀 INICIANDO ENVÍO...");
  console.log("=".repeat(70));

  // Enviar emails
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < contactsToProcess.length; i++) {
    const contact = contactsToProcess[i];

    console.log(`\n[${i + 1}/${contactsToProcess.length}]`);

    const success = await sendEmailToContact(contact);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Delay entre emails (excepto en el último)
    if (i < contactsToProcess.length - 1) {
      await sleep(SAFETY_CONFIG.delayBetweenEmails);
    }
  }

  // Resumen final
  console.log("\n" + "=".repeat(70));
  console.log("📊 RESUMEN FINAL");
  console.log("=".repeat(70));
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Fallidos: ${failCount}`);
  console.log(`📧 Total procesados: ${successCount + failCount}`);

  if (SAFETY_CONFIG.testMode) {
    console.log(`\n⚠️  MODO TEST - No se enviaron emails reales`);
    console.log(`   Para enviar emails reales:`);
    console.log(`   1. Verifica la lista de CONTACTS`);
    console.log(`   2. Personaliza el EMAIL_CONFIG (subject, contenido)`);
    console.log(`   3. Cambia testMode a false`);
    console.log(`   4. Ejecuta: npx tsx scripts/send-bulk-emails.ts`);
  }

  console.log("\n✅ Proceso completado!\n");
}

// ============================================================================
// EJECUCIÓN
// ============================================================================

sendBulkEmails().catch(console.error);
