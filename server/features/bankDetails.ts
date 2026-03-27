import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  encrypt,
  decrypt,
  maskSortCode,
  maskAccountNumber,
  formatSortCode,
  formatAccountNumber,
  isValidSortCode,
  isValidAccountNumber,
} from "../utils/encryption";

/**
 * Bank details management for instructors/promoters
 * Allows them to add their UK bank account for automatic payouts
 */
export const bankDetailsRouter = router({
  /**
   * Get current user's bank details (masked for security)
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user!.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // Return masked details for display
    return {
      hasDetails: !!(user.bankSortCode && user.bankAccountNumber),
      accountHolderName: user.bankAccountHolderName || null,
      sortCodeMasked: user.bankSortCode ? maskSortCode(decrypt(user.bankSortCode)) : null,
      accountNumberMasked: user.bankAccountNumber ? maskAccountNumber(decrypt(user.bankAccountNumber)) : null,
      verified: user.bankDetailsVerified || false,
    };
  }),

  /**
   * Save/update bank details
   */
  save: protectedProcedure
    .input(
      z.object({
        accountHolderName: z.string().min(2, "Name must be at least 2 characters"),
        sortCode: z.string().min(6, "Sort code is required"),
        accountNumber: z.string().min(8, "Account number is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Only instructors, promoters, and admins can add bank details
      const userRole = ctx.user!.role;
      if (!["instructor", "promoter", "admin"].includes(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only instructors, promoters, and admins can add bank details",
        });
      }

      try {
        // Format and validate
        const formattedSortCode = formatSortCode(input.sortCode);
        const formattedAccountNumber = formatAccountNumber(input.accountNumber);

        if (!isValidSortCode(formattedSortCode)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid sort code format. Use XX-XX-XX (e.g., 12-34-56)",
          });
        }

        if (!isValidAccountNumber(formattedAccountNumber)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid account number. Must be 8 digits",
          });
        }

        // Encrypt sensitive data
        const encryptedSortCode = encrypt(formattedSortCode);
        const encryptedAccountNumber = encrypt(formattedAccountNumber);

        // Save to database
        await db
          .update(users)
          .set({
            bankAccountHolderName: input.accountHolderName,
            bankSortCode: encryptedSortCode,
            bankAccountNumber: encryptedAccountNumber,
            bankDetailsVerified: false, // Reset verification when details change
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user!.id));

        console.log("[BANK_DETAILS] ✅ Bank details saved for user:", ctx.user!.id);

        return {
          success: true,
          message: "Bank details saved successfully. Admin will verify them before first payout.",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("[BANK_DETAILS] Error saving bank details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save bank details",
        });
      }
    }),

  /**
   * Remove bank details
   */
  remove: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await db
      .update(users)
      .set({
        bankAccountHolderName: null,
        bankSortCode: null,
        bankAccountNumber: null,
        bankDetailsVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user!.id));

    console.log("[BANK_DETAILS] 🗑️  Bank details removed for user:", ctx.user!.id);

    return {
      success: true,
      message: "Bank details removed successfully",
    };
  }),
});
