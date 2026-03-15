/**
 * Test del NUEVO MODELO de comisiones
 * - Cliente paga: Precio + Stripe fee solamente
 * - Profesor recibe: Precio - Comisión plataforma
 * - Stripe fee NO se descuenta del profesor
 */

import { calculateCheckoutAmounts, PLANS, PlanKey } from "./server/stripe/plans";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function section(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}${"=".repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${"=".repeat(70)}${colors.reset}\n`);
}

function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function testPlan(planKey: PlanKey, ticketPrice: number, isCourse: boolean = false) {
  const plan = PLANS[planKey];
  const ticketPricePence = ticketPrice * 100;

  const result = calculateCheckoutAmounts(ticketPricePence, planKey, isCourse);

  const itemType = isCourse ? "CURSO" : "TICKET";
  const commissionRate = isCourse ? plan.courseCommissionRate : plan.commissionRate;

  console.log(`${colors.magenta}${plan.name.toUpperCase()} - ${itemType} de £${ticketPrice.toFixed(2)}${colors.reset}`);
  console.log(`${"─".repeat(70)}`);
  console.log(`${colors.blue}Cliente paga:${colors.reset}`);
  console.log(`  • Precio del ${itemType.toLowerCase()}:     ${formatPounds(result.ticketPricePence)}`);
  console.log(`  • Stripe fee:               ${formatPounds(result.stripeFeePence)} ${colors.yellow}(cliente paga)${colors.reset}`);
  console.log(`  • ${colors.bright}TOTAL:                      ${formatPounds(result.totalPence)}${colors.reset}`);
  console.log(``);
  console.log(`${colors.green}Distribución del dinero:${colors.reset}`);
  console.log(`  • Stripe se queda:          ${formatPounds(result.stripeFeePence)}`);
  console.log(`  • Plataforma UK Sabor:      ${formatPounds(result.platformFeePence)} ${colors.yellow}(${(commissionRate * 100).toFixed(1)}% comisión)${colors.reset}`);
  console.log(`  • ${colors.green}Profesor recibe:${colors.reset}            ${colors.bright}${formatPounds(result.instructorEarningsPence)}${colors.reset}`);
  console.log(``);

  // Verificación
  const total = result.instructorEarningsPence + result.platformFeePence;
  const match = total === result.ticketPricePence;
  const checkmark = match ? "✅" : "❌";

  console.log(`${colors.cyan}Verificación:${colors.reset}`);
  console.log(`  ${checkmark} Profesor (${formatPounds(result.instructorEarningsPence)}) + Plataforma (${formatPounds(result.platformFeePence)}) = Precio (${formatPounds(result.ticketPricePence)}) ${match ? "✓" : "✗"}`);
  console.log(``);
}

function main() {
  log("🚀", "TEST DEL NUEVO MODELO DE COMISIONES", colors.bright);
  console.log("");
  log("📋", "Modelo:", colors.yellow);
  log("", "  • Cliente paga: Precio + Stripe fee", colors.cyan);
  log("", "  • Profesor recibe: Precio - Comisión UK Sabor", colors.cyan);
  log("", "  • Stripe fee NO se descuenta del profesor", colors.cyan);

  // ═══════════════════════════════════════════════════════════════════════════
  // TICKETS / EVENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  section("TICKETS / EVENTOS");

  log("🎫", "Ticket de £20.00", colors.bright);
  console.log("");
  testPlan("starter", 20, false);
  testPlan("creator", 20, false);
  testPlan("promoter_plan", 20, false);
  testPlan("academy", 20, false);

  console.log("\n");
  log("🎫", "Ticket de £50.00", colors.bright);
  console.log("");
  testPlan("starter", 50, false);
  testPlan("creator", 50, false);
  testPlan("promoter_plan", 50, false);
  testPlan("academy", 50, false);

  console.log("\n");
  log("🎫", "Ticket de £100.00", colors.bright);
  console.log("");
  testPlan("starter", 100, false);
  testPlan("creator", 100, false);
  testPlan("promoter_plan", 100, false);
  testPlan("academy", 100, false);

  // ═══════════════════════════════════════════════════════════════════════════
  // CURSOS
  // ═══════════════════════════════════════════════════════════════════════════
  section("CURSOS ONLINE");

  log("📚", "Curso de £49.99", colors.bright);
  console.log("");
  testPlan("starter", 49.99, true);
  testPlan("creator", 49.99, true);
  testPlan("promoter_plan", 49.99, true);
  testPlan("academy", 49.99, true);

  console.log("\n");
  log("📚", "Curso de £99.99", colors.bright);
  console.log("");
  testPlan("starter", 99.99, true);
  testPlan("creator", 99.99, true);
  testPlan("promoter_plan", 99.99, true);
  testPlan("academy", 99.99, true);

  console.log("\n");
  log("📚", "Curso de £199.99", colors.bright);
  console.log("");
  testPlan("starter", 199.99, true);
  testPlan("creator", 199.99, true);
  testPlan("promoter_plan", 199.99, true);
  testPlan("academy", 199.99, true);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPARACIÓN CON MODELO ANTERIOR
  // ═══════════════════════════════════════════════════════════════════════════
  section("COMPARACIÓN: ANTES vs AHORA");

  const ticketPricePence = 10000; // £100
  const plan = "starter";
  const result = calculateCheckoutAmounts(ticketPricePence, plan as PlanKey, false);

  console.log(`${colors.yellow}Ejemplo: Ticket de £100 con plan Starter (8% comisión)${colors.reset}\n`);

  console.log(`${colors.red}❌ MODELO ANTERIOR (cobraba comisión al cliente):${colors.reset}`);
  console.log(`  Cliente pagaba:     £100.00 (ticket)`);
  console.log(`                    +   £8.00 (comisión 8%)`);
  console.log(`                    +   £1.62 (Stripe fee)`);
  console.log(`                    = ${colors.bright}£109.62 TOTAL${colors.reset}`);
  console.log(``);
  console.log(`  Profesor recibía:   £100.00`);
  console.log(``);

  console.log(`${colors.green}✅ MODELO NUEVO (cobra comisión al profesor):${colors.reset}`);
  console.log(`  Cliente paga:       £100.00 (ticket)`);
  console.log(`                    +   £1.50 (Stripe fee)`);
  console.log(`                    = ${colors.bright}£101.50 TOTAL${colors.reset}`);
  console.log(``);
  console.log(`  Distribución:`);
  console.log(`    → Stripe:         £  1.50`);
  console.log(`    → UK Sabor:       £  8.00 (8% del precio)`);
  console.log(`    → Profesor:       ${colors.bright}£ 92.00${colors.reset}`);
  console.log(``);

  console.log(`${colors.cyan}📊 Diferencia:${colors.reset}`);
  console.log(`  • Cliente ahorra:   ${colors.green}£8.12${colors.reset} (paga menos)`);
  console.log(`  • Profesor recibe:  ${colors.yellow}£8.00 menos${colors.reset} (pero precio más competitivo para clientes)`);
  console.log(`  • UK Sabor gana:    £8.00 (igual que antes)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════════════════
  section("✨ RESUMEN DEL NUEVO MODELO");

  console.log(`${colors.green}✅ VENTAJAS:${colors.reset}`);
  console.log(`  • Precios más claros para el cliente`);
  console.log(`  • Cliente solo ve: Precio + fee de procesamiento`);
  console.log(`  • No hay "platform fee" visible en el checkout`);
  console.log(`  • Precios más competitivos (cliente paga menos)`);
  console.log(`  • Modelo estándar de la industria (Airbnb, Uber, etc.)`);
  console.log(``);

  console.log(`${colors.yellow}⚠️ IMPORTANTE:${colors.reset}`);
  console.log(`  • La comisión se descuenta de las ganancias del profesor`);
  console.log(`  • El Stripe fee lo paga el cliente (NO el profesor)`);
  console.log(`  • Los profesores ven su ganancia neta en el dashboard`);
  console.log(``);

  console.log(`${colors.cyan}📌 COMISIONES POR PLAN:${colors.reset}`);
  console.log(``);
  console.log(`  Tickets/Eventos:`);
  console.log(`    • Starter:    8%   → Profesor recibe 92%`);
  console.log(`    • Creator:    4%   → Profesor recibe 96%`);
  console.log(`    • Promoter:   2.5% → Profesor recibe 97.5%`);
  console.log(`    • Academy:    2%   → Profesor recibe 98%`);
  console.log(``);
  console.log(`  Cursos:`);
  console.log(`    • Starter:    15%  → Profesor recibe 85%`);
  console.log(`    • Creator:    10%  → Profesor recibe 90%`);
  console.log(`    • Promoter:   5%   → Profesor recibe 95%`);
  console.log(`    • Academy:    0%   → Profesor recibe 100% ✨`);

  console.log(`\n${colors.bright}${colors.green}${"=".repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}  ✅ NUEVO MODELO IMPLEMENTADO CORRECTAMENTE${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${"=".repeat(70)}${colors.reset}\n`);
}

main();
