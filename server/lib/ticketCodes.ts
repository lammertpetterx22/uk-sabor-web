/**
 * Short ticket / access code generator.
 *
 * Format: "UK-XXXX" (7 chars total) using a base-32 alphabet that skips
 * visually ambiguous characters (0/O, 1/I/L). Short enough to read out
 * loud at the door and search in a single keystroke; 31^4 ≈ 923k combos
 * still keeps collision probability tiny for the platform's scale, and
 * the DB's UNIQUE constraint on ticketCode catches any unlikely clash.
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

/** "UK-ABCD" — paid event ticket. */
export function generateTicketCode(): string {
  return `UK-${randomBlock(4)}`;
}

/** "UKC-ABCD" — paid class access code. "C" distinguishes from event. */
export function generateAccessCode(): string {
  return `UKC-${randomBlock(4)}`;
}

/** "GST-ABCD" — guest-list ticket. */
export function generateGuestTicketCode(): string {
  return `GST-${randomBlock(4)}`;
}

/** "CSH-ABCD" — cash-reservation placeholder code. */
export function generateCashTicketCode(): string {
  return `CSH-${randomBlock(4)}`;
}
