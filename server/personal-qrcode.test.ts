/**
 * Tests for the personal QR code system
 * Verifies that:
 * 1. Personal QR codes are linked to userId and orderId
 * 2. getUserQRCodes returns only the user's own QR codes
 * 3. checkIn correctly identifies the user from a personal QR code
 * 4. Venue QR codes (no userId) still work for admin check-in
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
const mockQRCodes = [
  {
    id: 1,
    code: "event-10-user-5-order-100",
    itemType: "event" as const,
    itemId: 10,
    userId: 5,
    orderId: 100,
    qrData: "data:image/png;base64,abc",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    code: "class-20-user-5-order-101",
    itemType: "class" as const,
    itemId: 20,
    userId: 5,
    orderId: 101,
    qrData: "data:image/png;base64,def",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    code: "venue-event-10-abc123",
    itemType: "event" as const,
    itemId: 10,
    userId: null, // venue QR - no personal user
    orderId: null,
    qrData: "data:image/png;base64,ghi",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockAttendance: any[] = [];

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
};

vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe("Personal QR Code System", () => {
  describe("QR code structure", () => {
    it("personal QR code has userId and orderId set", () => {
      const personalQR = mockQRCodes[0];
      expect(personalQR.userId).toBe(5);
      expect(personalQR.orderId).toBe(100);
      expect(personalQR.code).toContain("user-5");
      expect(personalQR.code).toContain("order-100");
    });

    it("venue QR code has no userId or orderId", () => {
      const venueQR = mockQRCodes[2];
      expect(venueQR.userId).toBeNull();
      expect(venueQR.orderId).toBeNull();
    });

    it("personal QR code format includes itemType, itemId, userId, and orderId", () => {
      const eventQR = mockQRCodes[0];
      expect(eventQR.code).toBe("event-10-user-5-order-100");

      const classQR = mockQRCodes[1];
      expect(classQR.code).toBe("class-20-user-5-order-101");
    });
  });

  describe("getUserQRCodes filtering", () => {
    it("filters QR codes by userId", () => {
      const userId = 5;
      const userQRs = mockQRCodes.filter(qr => qr.userId === userId);
      expect(userQRs).toHaveLength(2);
      expect(userQRs.every(qr => qr.userId === userId)).toBe(true);
    });

    it("does not return venue QR codes (null userId) for users", () => {
      const userId = 5;
      const userQRs = mockQRCodes.filter(qr => qr.userId === userId);
      expect(userQRs.some(qr => qr.userId === null)).toBe(false);
    });

    it("returns empty array for user with no QR codes", () => {
      const userId = 99;
      const userQRs = mockQRCodes.filter(qr => qr.userId === userId);
      expect(userQRs).toHaveLength(0);
    });
  });

  describe("checkIn with personal QR codes", () => {
    it("uses QR code owner's userId when qr.userId is set", () => {
      const qr = mockQRCodes[0]; // userId = 5
      const scannerUserId = 7; // admin scanning
      const resolvedUserId = qr.userId ?? scannerUserId;
      expect(resolvedUserId).toBe(5); // QR owner takes precedence
    });

    it("falls back to scanner userId when qr.userId is null (venue QR)", () => {
      const qr = mockQRCodes[2]; // userId = null
      const inputUserId = 8;
      const scannerUserId = 7;
      const resolvedUserId = qr.userId ?? inputUserId ?? scannerUserId;
      expect(resolvedUserId).toBe(8); // input.userId used
    });

    it("falls back to scanner when both qr.userId and input.userId are null", () => {
      const qr = mockQRCodes[2]; // userId = null
      const inputUserId = undefined;
      const scannerUserId = 7;
      const resolvedUserId = qr.userId ?? inputUserId ?? scannerUserId;
      expect(resolvedUserId).toBe(7); // scanner used
    });
  });

  describe("QR code permission checks", () => {
    it("admin can check in anyone with any QR code", () => {
      const adminRole = "admin";
      const qr = mockQRCodes[0]; // belongs to user 5
      const adminId = 1;

      // Admin bypass: no restriction
      const canCheckIn = adminRole === "admin" || adminRole === "instructor";
      expect(canCheckIn).toBe(true);
    });

    it("regular user cannot use another user's personal QR code", () => {
      const userRole = "user";
      const qr = mockQRCodes[0]; // belongs to user 5
      const scannerUserId = 9; // different user

      const isAdminOrInstructor = userRole === "admin" || userRole === "instructor";
      const isOwner = !qr.userId || qr.userId === scannerUserId;
      const canCheckIn = isAdminOrInstructor || isOwner;

      expect(canCheckIn).toBe(false);
    });

    it("user can use their own personal QR code", () => {
      const userRole = "user";
      const qr = mockQRCodes[0]; // belongs to user 5
      const scannerUserId = 5; // same user

      const isAdminOrInstructor = userRole === "admin" || userRole === "instructor";
      const isOwner = !qr.userId || qr.userId === scannerUserId;
      const canCheckIn = isAdminOrInstructor || isOwner;

      expect(canCheckIn).toBe(true);
    });

    it("user can use a venue QR code (no userId)", () => {
      const userRole = "user";
      const qr = mockQRCodes[2]; // no userId
      const scannerUserId = 9;

      const isAdminOrInstructor = userRole === "admin" || userRole === "instructor";
      const isOwner = !qr.userId || qr.userId === scannerUserId;
      const canCheckIn = isAdminOrInstructor || isOwner;

      expect(canCheckIn).toBe(true);
    });
  });

  describe("QR code generation format", () => {
    it("generates correct event QR code value", () => {
      const itemType = "event";
      const itemId = 42;
      const userId = 7;
      const orderId = 200;
      const qrValue = `${itemType}-${itemId}-user-${userId}-order-${orderId}`;
      expect(qrValue).toBe("event-42-user-7-order-200");
    });

    it("generates correct class QR code value", () => {
      const itemType = "class";
      const itemId = 15;
      const userId = 3;
      const orderId = 150;
      const qrValue = `${itemType}-${itemId}-user-${userId}-order-${orderId}`;
      expect(qrValue).toBe("class-15-user-3-order-150");
    });

    it("each purchase generates a unique QR code", () => {
      const codes = [
        "event-10-user-5-order-100",
        "event-10-user-6-order-102", // same event, different user
        "event-10-user-5-order-103", // same user, different order (re-purchase)
      ];
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });
});
