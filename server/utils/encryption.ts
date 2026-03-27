import crypto from "crypto";

/**
 * Encrypt/Decrypt sensitive bank details
 * Uses AES-256-GCM for strong encryption
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment variable
 * This should be a 32-byte random string stored in BANK_ENCRYPTION_KEY
 */
function getEncryptionKey(): Buffer {
  const key = process.env.BANK_ENCRYPTION_KEY;

  if (!key) {
    // In development, use a default key (NOT FOR PRODUCTION!)
    if (process.env.NODE_ENV === "development") {
      console.warn("[ENCRYPTION] ⚠️  Using default encryption key - NOT SECURE FOR PRODUCTION!");
      return Buffer.from("12345678901234567890123456789012"); // 32 bytes
    }
    throw new Error("BANK_ENCRYPTION_KEY environment variable is required");
  }

  // Convert hex string to buffer
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a string (e.g., sort code or account number)
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    // Format: iv:encrypted:tag (all in hex)
    return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
  } catch (error) {
    console.error("[ENCRYPTION] Error encrypting data:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[ENCRYPTION] Error decrypting data:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Mask sensitive data for display (e.g., "12-34-56" -> "**-**-56")
 */
export function maskSortCode(sortCode: string): string {
  if (!sortCode) return "";
  const parts = sortCode.split("-");
  if (parts.length !== 3) return "**-**-**";
  return `**-**-${parts[2]}`;
}

/**
 * Mask account number (e.g., "12345678" -> "****5678")
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return "";
  if (accountNumber.length < 4) return "****";
  return `****${accountNumber.slice(-4)}`;
}

/**
 * Validate UK Sort Code format (XX-XX-XX)
 */
export function isValidSortCode(sortCode: string): boolean {
  const pattern = /^\d{2}-\d{2}-\d{2}$/;
  return pattern.test(sortCode);
}

/**
 * Validate UK Account Number (8 digits)
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  const pattern = /^\d{8}$/;
  return pattern.test(accountNumber);
}

/**
 * Format sort code from user input (removes spaces, adds dashes)
 * Input: "123456" or "12 34 56" or "12-34-56"
 * Output: "12-34-56"
 */
export function formatSortCode(input: string): string {
  const cleaned = input.replace(/[^0-9]/g, "");
  if (cleaned.length !== 6) {
    throw new Error("Sort code must be 6 digits");
  }
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
}

/**
 * Format account number (removes spaces/dashes)
 * Input: "1234 5678" or "12345678"
 * Output: "12345678"
 */
export function formatAccountNumber(input: string): string {
  const cleaned = input.replace(/[^0-9]/g, "");
  if (cleaned.length !== 8) {
    throw new Error("Account number must be 8 digits");
  }
  return cleaned;
}

/**
 * Generate a random encryption key (for initial setup)
 * Run this once and store the result in BANK_ENCRYPTION_KEY environment variable
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}
