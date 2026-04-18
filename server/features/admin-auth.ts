import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, passwordResetTokens } from "../../drizzle/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME, ONE_DAY_MS } from "@shared/const";
import { sendWelcomeEmail, sendEmail } from "./email";

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

      // Send welcome email immediately (wait for it to complete)
      console.log("[ADMIN-AUTH-REGISTRATION] ✅ User created:", {
        email: createdUser.email,
        name: createdUser.name,
        id: createdUser.id,
        hasResendKey: !!process.env.RESEND_API_KEY
      });

      if (createdUser.email && createdUser.name) {
        console.log("[ADMIN-AUTH-REGISTRATION] 📧 Attempting to send welcome email to:", createdUser.email);
        console.log("[ADMIN-AUTH-REGISTRATION] 🔑 RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
        console.log("[ADMIN-AUTH-REGISTRATION] 📍 About to call sendWelcomeEmail function...");

        try {
          const emailSuccess = await sendWelcomeEmail({
            to: createdUser.email,
            userName: createdUser.name,
          });

          if (emailSuccess) {
            console.log("[ADMIN-AUTH-REGISTRATION] ✅ Welcome email sent successfully to:", createdUser.email);
          } else {
            console.error("[ADMIN-AUTH-REGISTRATION] ❌ Welcome email returned false for:", createdUser.email);
          }
        } catch (error) {
          console.error("[ADMIN-AUTH-REGISTRATION] ❌ Failed to send welcome email:", error);
          // Don't throw - continue with registration even if email fails
        }
      } else {
        console.error("[ADMIN-AUTH-REGISTRATION] ⚠️  Email or name missing - cannot send welcome email", {
          hasEmail: !!createdUser.email,
          hasName: !!createdUser.name
        });
      }

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
        // Account has no password set (e.g. guest list entry or OAuth-only).
        // Refuse login and direct the user to the password reset flow — never
        // silently accept whatever password was typed as the new one.
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Esta cuenta todavía no tiene contraseña. Usa 'Forgot password' para establecer una.",
        });
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

  /**
   * Change password for the currently logged-in user.
   * - If the user already has a password, require `currentPassword` and verify it.
   * - If the user has no password yet (e.g. guest list entry signed in via
   *   another method), accept a missing `currentPassword` and set the new one.
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [me] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!me) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });

      if (me.passwordHash) {
        if (!input.currentPassword) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Current password required" });
        }
        const ok = await verifyPassword(input.currentPassword, me.passwordHash);
        if (!ok) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "La contraseña actual es incorrecta" });
        }
      }

      const newHash = await hashPassword(input.newPassword);
      await db.update(users)
        .set({ passwordHash: newHash, loginMethod: "custom" })
        .where(eq(users.id, me.id));

      return { success: true };
    }),

  /**
   * Request a password reset — sends an email with a reset link.
   * Always returns success regardless of whether the email exists,
   * to avoid leaking which addresses are registered.
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().trim().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.trim().toLowerCase();
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.insert(passwordResetTokens).values({
          userId: user.id,
          token,
          expiresAt,
        });

        const baseUrl = process.env.PUBLIC_BASE_URL || "https://www.consabor.uk";
        const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

        try {
          await sendEmail({
            to: user.email || email,
            subject: "Reset your UK Sabor password",
            htmlContent: buildResetPasswordEmailHtml({
              userName: user.name || "there",
              resetUrl,
            }),
          });
        } catch (e) {
          console.error("[PasswordReset] Failed to send email:", e);
        }
      }

      return { success: true };
    }),

  /**
   * Complete a password reset with a valid token.
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(16),
        newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [record] = await db
        .select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, input.token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ))
        .limit(1);

      if (!record) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link is invalid or has expired. Request a new one.",
        });
      }

      const newHash = await hashPassword(input.newPassword);
      await db.update(users)
        .set({ passwordHash: newHash, loginMethod: "custom" })
        .where(eq(users.id, record.userId));

      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, record.id));

      return { success: true };
    }),
});

// ─── Email template ───────────────────────────────────────────────────────────

function buildResetPasswordEmailHtml(opts: { userName: string; resetUrl: string }): string {
  const name = escapeHtml(opts.userName);
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password — UK Sabor</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr><td style="background:linear-gradient(135deg,#FA3698 0%,#FD4D43 100%);padding:36px 30px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">🔐 Reset your password</h1>
          </td></tr>
          <tr><td style="padding:30px;">
            <p style="margin:0 0 16px 0;font-size:16px;color:#1a1a1a;">Hi <strong>${name}</strong>,</p>
            <p style="margin:0 0 20px 0;font-size:15px;color:#444;line-height:1.6;">
              We received a request to reset your UK Sabor password. Click the button below
              to choose a new one. This link expires in <strong>1 hour</strong>.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${opts.resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#FA3698 0%,#FD4D43 100%);color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                Reset Password
              </a>
            </div>
            <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Or copy and paste this link:</p>
            <p style="margin:0 0 20px 0;font-size:12px;color:#888;word-break:break-all;background:#f5f5f5;padding:10px;border-radius:6px;">${escapeHtml(opts.resetUrl)}</p>
            <div style="background:#fff3cd;border-left:4px solid #ffc107;border-radius:6px;padding:12px;font-size:12px;color:#664d03;">
              Didn't request this? You can safely ignore this email — your password won't change.
            </div>
          </td></tr>
          <tr><td style="background:#f5f5f5;padding:18px;text-align:center;font-size:12px;color:#888;border-top:1px solid #e5e5e5;">
            © ${new Date().getFullYear()} UK Sabor · <a href="https://www.consabor.uk" style="color:#FA3698;text-decoration:none;">www.consabor.uk</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
