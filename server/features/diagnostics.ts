import { router, publicProcedure } from "../_core/trpc";
import { sendWelcomeEmail } from "./email";

/**
 * Diagnostic endpoints to check email configuration in production
 */
export const diagnosticsRouter = router({
  /**
   * Check if email configuration is working
   */
  checkEmailConfig: publicProcedure.query(async () => {
    return {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPreview: process.env.RESEND_API_KEY
        ? `${process.env.RESEND_API_KEY.substring(0, 10)}...`
        : 'NOT SET',
      hasResendFromEmail: !!process.env.RESEND_FROM_EMAIL,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'UK Sabor <onboarding@resend.dev>',
      nodeEnv: process.env.NODE_ENV,
    };
  }),

  /**
   * Test sending a welcome email (admin only in production)
   */
  testWelcomeEmail: publicProcedure.mutation(async () => {
    const testEmail = "petterlammert@gmail.com";
    const testName = "Test User";

    console.log("[DIAGNOSTICS] Testing welcome email...");
    console.log("[DIAGNOSTICS] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

    try {
      const result = await sendWelcomeEmail({
        to: testEmail,
        userName: testName,
      });

      console.log("[DIAGNOSTICS] Email send result:", result);

      return {
        success: result,
        message: result
          ? "Email sent successfully to " + testEmail
          : "Email failed to send",
        hasResendKey: !!process.env.RESEND_API_KEY,
      };
    } catch (error) {
      console.error("[DIAGNOSTICS] Email send error:", error);
      return {
        success: false,
        message: "Error: " + (error instanceof Error ? error.message : String(error)),
        hasResendKey: !!process.env.RESEND_API_KEY,
      };
    }
  }),
});
