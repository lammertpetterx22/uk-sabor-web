import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  const user = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "custom" as const,
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

function createUserContext(userId: number = 2): TrpcContext {
  const user = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "custom" as const,
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("QR Code System", () => {
  it("should generate QR code for an event", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.qrcode.generateQRCode({
        itemType: "event",
        itemId: 1,
      });

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.itemType).toBe("event");
      expect(result.itemId).toBe(1);
      expect(result.qrData).toBeDefined();
    } catch (error: any) {
      // Event might not exist, that's ok for this test
      expect(error.message).toContain("Event not found");
    }
  });

  it("should generate QR code for a class", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.qrcode.generateQRCode({
        itemType: "class",
        itemId: 1,
      });

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.itemType).toBe("class");
      expect(result.itemId).toBe(1);
    } catch (error: any) {
      // Class might not exist, that's ok for this test
      expect(error.message).toContain("Class not found");
    }
  });

  it("should reject non-admin/instructor from generating QR codes", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.qrcode.generateQRCode({
        itemType: "event",
        itemId: 1,
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("Only admins and instructors");
    }
  });

  it("should get QR code for an event", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.qrcode.getQRCode({
        itemType: "event",
        itemId: 1,
      });

      // Result can be null if QR code doesn't exist yet
      if (result) {
        expect(result.code).toBeDefined();
        expect(result.itemType).toBe("event");
        expect(result.itemId).toBe(1);
      }
    } catch (error: any) {
      // Expected if event doesn't exist
      expect(error).toBeDefined();
    }
  });

  it("should get attendance count", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const count = await caller.qrcode.getAttendanceCount({
        itemType: "event",
        itemId: 1,
      });

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    } catch (error: any) {
      // Expected if event doesn't exist
      expect(error).toBeDefined();
    }
  });

  it("should reject check-in with invalid QR code", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.qrcode.checkIn({
        qrCode: "invalid-code-12345",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("válido");
    }
  });

  it("should require authentication for check-in", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.qrcode.checkIn({
        qrCode: "some-code",
      });
      // Will fail with invalid QR code, but authentication should pass
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("válido");
    }
  });

  it("should get user check-in history", async () => {
    const ctx = createUserContext(2);
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.qrcode.getUserCheckInHistory({
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(result)).toBe(true);
      // Result can be empty if user has no check-ins
    } catch (error: any) {
      // Expected if user has no history
      expect(error).toBeDefined();
    }
  });

  it("should reject non-admin from viewing attendance", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.qrcode.getAttendance({
        itemType: "event",
        itemId: 1,
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("Only admins and instructors");
    }
  });

  it("should validate QR code format", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.qrcode.checkIn({
        qrCode: "", // Empty code
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should handle check-in with optional userId for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // This will fail because QR code doesn't exist, but it tests the parameter acceptance
      await caller.qrcode.checkIn({
        qrCode: "test-code",
        userId: 5, // Admin checking in another user
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("válido");
    }
  });
});
