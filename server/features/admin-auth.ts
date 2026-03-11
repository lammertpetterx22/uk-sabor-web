import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME, ONE_DAY_MS } from "@shared/const";

const BCRYPT_ROUNDS = 12;

// ─── Password hashing (bcrypt) ────────────────────────────────────────────────

/**
 * Hash a password with bcrypt.
 * All new registrations and re-hashes on login use this.
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Detect hash algorithm from the stored hash format.
 * - bcrypt hashes begin with "$2b$" (or "$2a$")
 * - SHA-256 legacy hashes are "salt:sha256hex" (64-char hex after colon)
 */
function isLegacySha256(storedHash: string): boolean {
  return !storedHash.startsWith("$2");
}

/**
 * Verify a plaintext password against a stored hash.
 * Supports both bcrypt (modern) and SHA-256+salt (legacy).
 * Returns true if the password matches.
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isLegacySha256(storedHash)) {
    // Legacy SHA-256: format is "salt:hash"
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const computedHash = crypto.createHash("sha256").update(salt + password).digest("hex");
    return computedHash === hash;
  }
  // Modern bcrypt
  return bcrypt.compare(password, storedHash);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const adminAuthRouter = router({
  /**
   * Register a new user account (bcrypt from the start)
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if email already exists
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe una cuenta con este email",
        });
      }

      // Hash password with bcrypt (new registrations always use bcrypt)
      const passwordHash = await hashPassword(input.password);

      // Generate a unique openId for custom auth users
      const openId = "custom_" + crypto.randomBytes(16).toString("hex");

      // Insert new user
      await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        passwordHash,
        loginMethod: "custom",
        role: "user",
      });

      // Fetch the newly created user
      const newUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      if (!newUser.length) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
      }

      const createdUser = newUser[0];

      // Create session token (same as OAuth flow)
      const sessionToken = await sdk.createSessionToken(openId, {
        name: input.name,
        expiresInMs: ONE_DAY_MS,
      });

      // Set session cookie (maxAge in ms — 24h)
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_DAY_MS });

      return {
        success: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          role: createdUser.role,
        },
      };
    }),

  /**
   * Login with email and password.
   * Supports both bcrypt (new) and SHA-256 (legacy) hashes.
   * On successful login with a legacy hash, silently re-hashes to bcrypt.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user by email
      const userResults = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (!userResults || userResults.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email o contraseña incorrectos",
        });
      }

      const foundUser = userResults[0];

      if (!foundUser.passwordHash) {
        // OAuth account — set a password on first email/password attempt
        const newPasswordHash = await hashPassword(input.password);
        await db.update(users).set({ passwordHash: newPasswordHash, loginMethod: "custom" }).where(eq(users.id, foundUser.id));
      } else {
        // Verify password (supports both bcrypt and legacy SHA-256)
        const isValid = await verifyPassword(input.password, foundUser.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email o contraseña incorrectos",
          });
        }

        // ── Lazy bcrypt migration ──────────────────────────────────────────────
        // If the stored hash is an old SHA-256 one, silently upgrade it to bcrypt now.
        // The user won't notice — it's transparent and happens only once per user.
        if (isLegacySha256(foundUser.passwordHash)) {
          const upgradedHash = await hashPassword(input.password);
          await db.update(users)
            .set({ passwordHash: upgradedHash })
            .where(eq(users.id, foundUser.id));
        }
      }

      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, foundUser.id));

      // Create session token (same as OAuth flow)
      const sessionToken = await sdk.createSessionToken(foundUser.openId, {
        name: foundUser.name || "",
        expiresInMs: ONE_DAY_MS,
      });

      // Set session cookie (maxAge in ms — 24h)
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_DAY_MS });

      return {
        success: true,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
        },
      };
    }),
});
