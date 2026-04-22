/**
 * Short ticket / access code generator.
 *
 * Format: a plain 5-character code (e.g. "K9F2X") from an unambiguous
 * base-31 alphabet that drops 0/O/1/I/L. No prefix — the ticket type is
 * already known from the DB record, so the code stays as short as
 * possible for buyers to speak and for staff to search.
 *
 * 31^5 ≈ 28.6 million combinations, which leaves collision probability
 * vanishing small at the platform's scale. The DB's UNIQUE constraint on
 * ticketCode is the ultimate safety net.
 */

// Unambiguous base-31 alphabet (no 0/O/1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

function randomBlock(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return out;
}

/** Paid event ticket code — 5 chars, e.g. "K9F2X". */
export function generateTicketCode(): string {
  return randomBlock(CODE_LENGTH);
}

/** Paid class access code — 5 chars. */
export function generateAccessCode(): string {
  return randomBlock(CODE_LENGTH);
}

/** Guest-list ticket code — 5 chars. */
export function generateGuestTicketCode(): string {
  return randomBlock(CODE_LENGTH);
}

/** Cash-reservation ticket code — 5 chars. */
export function generateCashTicketCode(): string {
  return randomBlock(CODE_LENGTH);
}
