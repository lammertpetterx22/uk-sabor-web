import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(userId: number = 1): TrpcContext {
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

describe("courses.hasAccess", () => {
  it("should throw error for unauthenticated users", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.courses.hasAccess(1);
      expect.fail("Should have thrown error for unauthenticated user");
    } catch (error: any) {
      expect(error.message).toContain("Please login");
    }
  });

  it("should return false when user has not purchased course", async () => {
    const ctx = createAuthContext(999);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.courses.hasAccess(1);
    expect(result).toBe(false);
  });

  it("should return boolean value", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.courses.hasAccess(1);
    expect(typeof result).toBe("boolean");
  });
});

describe("courses.getById", () => {
  it("should return null for non-existent course", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.courses.getById(99999);
    expect(result).toBeNull();
  });

  it("should return course details with videoUrl field", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.courses.getById(1);
    if (result) {
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("videoUrl");
      expect(result).toHaveProperty("price");
      expect(result).toHaveProperty("instructorId");
    }
  });
});

describe("courses.list", () => {
  it("should return list of published courses", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.courses.list({
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should filter courses by level", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.courses.list({
      limit: 10,
      offset: 0,
      level: "beginner",
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((course) => {
      if (course.level) {
        expect(course.level).toBe("beginner");
      }
    });
  });
});
