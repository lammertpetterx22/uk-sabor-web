/**
 * Short ticket / access code generator.
 *
 * Format: "UK-XXXXXX" (9 chars total) using a base-32 alphabet that skips
 * visually ambiguous characters (0/O, 1/I/L). This keeps codes short enough
 * to read out loud at the door, type quickly into a search box, and still
 * gives 32^6 ≈ 1 billion combinations — collision probability stays vanishing
 * small even with millions of tickets. The DB has a UNIQUE constraint on
 * ticketCode, so we retry a few times if we're ever unlucky.
 */

// Unambiguous base-32 alphabet (no 0/O/1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomBlock(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return out;
}

/** "UK-ABC123" — paid event ticket. */
export function generateTicketCode(): string {
  return `UK-${randomBlock(6)}`;
}

/** "UKC-ABC123" — paid class access code. Same length/alphabet, "C" flags it as a class. */
export function generateAccessCode(): string {
  return `UKC-${randomBlock(6)}`;
}

/** "GST-ABC123" — guest-list ticket. */
export function generateGuestTicketCode(): string {
  return `GST-${randomBlock(6)}`;
}

/** "CASH-ABC123" — cash-reservation placeholder code. */
export function generateCashTicketCode(): string {
  return `CASH-${randomBlock(6)}`;
}
