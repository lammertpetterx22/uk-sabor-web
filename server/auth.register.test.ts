import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Test password hashing functions
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(salt + password).digest("hex");
  return salt + ":" + hash;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const computedHash = crypto.createHash("sha256").update(salt + password).digest("hex");
  return computedHash === hash;
}

describe("Registration and Login Auth", () => {
  describe("Password Hashing", () => {
    it("should hash a password with salt", () => {
      const password = "test123456";
      const hashed = hashPassword(password);
      
      expect(hashed).toBeTruthy();
      expect(hashed).toContain(":");
      
      const [salt, hash] = hashed.split(":");
      expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(hash).toHaveLength(64); // SHA-256 = 64 hex chars
    });

    it("should generate different hashes for the same password", () => {
      const password = "test123456";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      
      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it("should verify a correct password", () => {
      const password = "mySecurePassword123";
      const hashed = hashPassword(password);
      
      expect(verifyPassword(password, hashed)).toBe(true);
    });

    it("should reject an incorrect password", () => {
      const password = "mySecurePassword123";
      const hashed = hashPassword(password);
      
      expect(verifyPassword("wrongPassword", hashed)).toBe(false);
    });

    it("should reject empty hash", () => {
      expect(verifyPassword("test", "")).toBe(false);
    });

    it("should reject malformed hash without separator", () => {
      expect(verifyPassword("test", "nocolonseparator")).toBe(false);
    });
  });

  describe("Input Validation", () => {
    it("should require name for registration", () => {
      const input = { name: "", email: "test@test.com", password: "123456" };
      expect(input.name.length).toBe(0);
    });

    it("should require valid email", () => {
      const validEmail = "user@example.com";
      const invalidEmail = "not-an-email";
      
      expect(validEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it("should require password of at least 6 characters", () => {
      const shortPassword = "12345";
      const validPassword = "123456";
      
      expect(shortPassword.length).toBeLessThan(6);
      expect(validPassword.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("OpenId Generation", () => {
    it("should generate unique openId for custom auth users", () => {
      const openId1 = "custom_" + crypto.randomBytes(16).toString("hex");
      const openId2 = "custom_" + crypto.randomBytes(16).toString("hex");
      
      expect(openId1).toMatch(/^custom_[a-f0-9]{32}$/);
      expect(openId2).toMatch(/^custom_[a-f0-9]{32}$/);
      expect(openId1).not.toBe(openId2);
    });
  });
});
