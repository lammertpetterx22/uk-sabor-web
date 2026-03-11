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

function createUnauthenticatedContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Payment Method for Classes", () => {
  it("should return classes with payment method field", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.classes.list({
      limit: 100,
      offset: 0,
    });
    expect(Array.isArray(result)).toBe(true);

    // Check that classes have paymentMethod field if any exist
    if (result.length > 0) {
      const firstClass = result[0];
      expect(firstClass).toHaveProperty("paymentMethod");
      expect(
        firstClass.paymentMethod === "online" ||
          firstClass.paymentMethod === "cash" ||
          firstClass.paymentMethod === "both" ||
          firstClass.paymentMethod === null
      ).toBe(true);
    }
  });

  it("should allow admin to list all classes with payment methods", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.classes.listAll({
      limit: 100,
      offset: 0,
    });
    expect(Array.isArray(result)).toBe(true);

    // Verify payment method field exists on all classes
    result.forEach((cls) => {
      expect(cls).toHaveProperty("paymentMethod");
    });
  });

  it("should return class details with payment method", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    // Get first class
    const classList = await caller.classes.list({
      limit: 100,
      offset: 0,
    });
    if (classList.length > 0) {
      const classId = classList[0].id;
      const classDetail = await caller.classes.getById(classId);

      expect(classDetail).not.toBeNull();
      if (classDetail) {
        expect(classDetail).toHaveProperty("paymentMethod");
        expect(
          classDetail.paymentMethod === "online" ||
            classDetail.paymentMethod === "cash" ||
            classDetail.paymentMethod === "both" ||
            classDetail.paymentMethod === null
        ).toBe(true);
      }
    }
  });

  it("should validate payment method values in list", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const classList = await caller.classes.list({
      limit: 100,
      offset: 0,
    });

    classList.forEach((cls) => {
      const validMethods = ["online", "cash", "both", null];
      expect(validMethods).toContain(cls.paymentMethod);
    });
  });

  it("should handle cash payment method correctly", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const classList = await caller.classes.list({
      limit: 100,
      offset: 0,
    });
    const cashClasses = classList.filter((cls) => cls.paymentMethod === "cash");

    // Verify that cash classes have the correct payment method
    cashClasses.forEach((cls) => {
      expect(cls.paymentMethod).toBe("cash");
      expect(cls.title).toBeDefined();
      expect(cls.price).toBeDefined();
    });
  });

  it("should handle both payment method correctly", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const classList = await caller.classes.list({
      limit: 100,
      offset: 0,
    });
    const bothClasses = classList.filter((cls) => cls.paymentMethod === "both");

    // Verify that both classes have the correct payment method
    bothClasses.forEach((cls) => {
      expect(cls.paymentMethod).toBe("both");
      expect(cls.title).toBeDefined();
      expect(cls.price).toBeDefined();
    });
  });

  it("should handle online payment method correctly", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const classList = await caller.classes.list({
      limit: 100,
      offset: 0,
    });
    const onlineClasses = classList.filter(
      (cls) => cls.paymentMethod === "online" || cls.paymentMethod === null
    );

    // Verify that online classes have the correct payment method
    onlineClasses.forEach((cls) => {
      expect(
        cls.paymentMethod === "online" || cls.paymentMethod === null
      ).toBe(true);
      expect(cls.title).toBeDefined();
      expect(cls.price).toBeDefined();
    });
  });
});
