// Script to verify webhook configuration
import { config } from "dotenv";
config();

console.log("\n🔍 VERIFICANDO CONFIGURACIÓN DE WEBHOOK\n");
console.log("=" .repeat(60));

// Check environment variables
console.log("\n📋 Variables de entorno:");
console.log("-".repeat(60));
console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? `✅ Configurado (${process.env.STRIPE_SECRET_KEY.substring(0, 15)}...)` : "❌ NO configurado");
console.log("STRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET ? `✅ Configurado (${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 15)}...)` : "❌ NO configurado");
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? `✅ Configurado (${process.env.RESEND_API_KEY.substring(0, 10)}...)` : "❌ NO configurado");
console.log("RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL || "❌ NO configurado");

console.log("\n" + "=".repeat(60));

// Check if webhook secret format is correct
if (process.env.STRIPE_WEBHOOK_SECRET) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log("\n🔐 Formato del STRIPE_WEBHOOK_SECRET:");
  console.log("-".repeat(60));

  if (secret.startsWith("whsec_")) {
    console.log("✅ Formato correcto (empieza con 'whsec_')");
    console.log(`   Longitud: ${secret.length} caracteres`);
  } else {
    console.log("❌ Formato INCORRECTO");
    console.log(`   El secreto debe empezar con 'whsec_'`);
    console.log(`   Valor actual empieza con: '${secret.substring(0, 10)}...'`);
  }
}

console.log("\n" + "=".repeat(60));

console.log("\n📊 SIGUIENTE PASO:");
console.log("-".repeat(60));
console.log("1. Ve a Koyeb Dashboard → Logs");
console.log("2. Busca mensajes de [Webhook] después de la compra");
console.log("3. Si no hay logs de [Webhook], el webhook NO está llegando");
console.log("4. Si hay errores de 'signature verification', el secreto es incorrecto");
console.log("\n");
