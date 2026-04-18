import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerEmailTrackingRoutes } from "../features/emailTracking";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite HMR and inline scripts
    crossOriginEmbedderPolicy: false, // Disabled for media loading
  }));

  // Stripe webhook MUST be registered BEFORE body parsers
  const { handleStripeWebhook } = await import("../stripe/webhook");
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  // Configure body parser with larger size limit for video uploads (2GB for 20-40 min videos)
  app.use(express.json({ limit: "2gb" }));
  app.use(express.urlencoded({ limit: "2gb", extended: true }));

  // Extended timeout for video upload requests (10 minutes)
  app.use((req, res, next) => {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000); // 10 minutes
    next();
  });
  // Health check endpoint for Koyeb and other hosting providers
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: Date.now() });
  });

  // Email configuration check endpoint
  app.get("/api/email-config", (req, res) => {
    res.status(200).json({
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPreview: process.env.RESEND_API_KEY
        ? `${process.env.RESEND_API_KEY.substring(0, 10)}...`
        : 'NOT SET',
      hasResendFromEmail: !!process.env.RESEND_FROM_EMAIL,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'UK Sabor <onboarding@resend.dev>',
      nodeEnv: process.env.NODE_ENV,
    });
  });

  // Test email sending endpoint (for debugging)
  app.post("/api/test-email", async (req, res) => {
    const { sendWelcomeEmail } = await import("../features/email");
    const { to, userName } = req.body;

    if (!to || !userName) {
      return res.status(400).json({ error: "Missing 'to' or 'userName' in request body" });
    }

    console.log("[TEST-EMAIL] Attempting to send test email to:", to);
    console.log("[TEST-EMAIL] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
    console.log("[TEST-EMAIL] RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL || 'UK Sabor <onboarding@resend.dev>');

    try {
      const success = await sendWelcomeEmail({ to, userName });
      if (success) {
        console.log("[TEST-EMAIL] ✅ Email sent successfully");
        return res.status(200).json({ success: true, message: "Email sent successfully" });
      } else {
        console.error("[TEST-EMAIL] ❌ Email sending returned false");
        return res.status(500).json({ success: false, message: "Email sending failed (returned false)" });
      }
    } catch (error) {
      console.error("[TEST-EMAIL] ❌ Error sending email:", error);
      return res.status(500).json({ success: false, message: "Email sending error", error: String(error) });
    }
  });

  // Debug endpoint to check if static files exist
  app.get("/api/debug/static", async (req, res) => {
    const fs = await import("fs");
    const path = await import("path");

    const paths: {
      cwd: string;
      dirname: string;
      distPublic: string;
      distPublicExists: boolean;
      distPublicContents?: string[];
      assetsCount?: number;
      sampleAssets?: string[];
      error?: string;
    } = {
      cwd: process.cwd(),
      dirname: import.meta.dirname,
      distPublic: path.resolve(process.cwd(), "dist", "public"),
      distPublicExists: fs.existsSync(path.resolve(process.cwd(), "dist", "public")),
    };

    if (paths.distPublicExists) {
      try {
        const files = fs.readdirSync(path.resolve(process.cwd(), "dist", "public"));
        paths.distPublicContents = files;

        const assetsPath = path.resolve(process.cwd(), "dist", "public", "assets");
        if (fs.existsSync(assetsPath)) {
          const assetFiles = fs.readdirSync(assetsPath);
          paths.assetsCount = assetFiles.length;
          paths.sampleAssets = assetFiles.slice(0, 5);
        }
      } catch (e: any) {
        paths.error = e.message;
      }
    }

    res.json(paths);
  });

  app.get("/", (req, res, next) => {
    // If this is an API health check request, respond with JSON
    if (req.accepts("json") && !req.accepts("html")) {
      return res.status(200).json({ status: "ok", timestamp: Date.now() });
    }
    // Otherwise, let it continue to serve the React app
    next();
  });

  // Email open/click tracking endpoints (public, no auth required)
  registerEmailTrackingRoutes(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.get("/api/migrate-schema", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.send("DB not available");

      let results = [];

      // Check current database and schema
      const currentDbResult: any = await db.execute(sql.raw(`SELECT current_database(), current_schema()`));
      results.push({
        step: "Current database and schema",
        current: currentDbResult?.[0] || null
      });

      // List ALL tables regardless of schema
      const allTablesAnySchemaResult: any = await db.execute(sql.raw(`
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
        ORDER BY table_schema, table_name
      `));

      results.push({
        step: "ALL tables in database (any schema)",
        tables: allTablesAnySchemaResult || []
      });

      // Check if lessons table exists
      const tableExistsResult: any = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'lessons'
        )
      `));

      results.push({
        step: "Does lessons table exist (any schema)?",
        exists: tableExistsResult?.[0] || null
      });

      // List all tables in public schema
      const allTablesResult: any = await db.execute(sql.raw(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `));

      results.push({
        step: "All tables in public schema",
        tables: allTablesResult || []
      });

      // Check what columns currently exist in lessons table
      const checkColumnsResult: any = await db.execute(sql.raw(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lessons'
        ORDER BY ordinal_position
      `));

      results.push({
        step: "Current lessons table columns",
        columns: checkColumnsResult || []
      });

      // Now run migrations
      const queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"stripeCustomerId\" VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"stripeAccountId\" VARCHAR(255)",
        // Add Bunny.net columns to lessons table with proper quoting
        "ALTER TABLE lessons ADD COLUMN IF NOT EXISTS \"bunnyVideoId\" VARCHAR(255)",
        "ALTER TABLE lessons ADD COLUMN IF NOT EXISTS \"bunnyLibraryId\" VARCHAR(255)",
      ];

      for (const q of queries) {
        try {
          await db.execute(sql.raw(q));
          results.push({ success: true, query: q });
        } catch (e: any) {
          console.error("MIGRATION ERROR details:", e);
          results.push({ success: false, query: q, error: e.message });
        }
      }

      // Check columns again after migration
      const checkColumnsAfterResult: any = await db.execute(sql.raw(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lessons'
        ORDER BY ordinal_position
      `));

      results.push({
        step: "Lessons table columns AFTER migration",
        columns: checkColumnsAfterResult || []
      });

      res.json({
        success: true,
        results,
        message: "Migration complete! Check the results to see if bunnyVideoId and bunnyLibraryId were added."
      });
    } catch (e: any) {
      res.json({
        success: false,
        error: e.message,
        stack: e.stack
      });
    }
  });

  // Debug endpoint to check lessons table structure
  app.get("/api/debug/lessons/:courseId", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { eq, asc } = await import("drizzle-orm");
      const { lessons } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) return res.json({ error: "DB not available" });

      const courseId = parseInt(req.params.courseId);

      // Get lessons for this course using Drizzle ORM
      const allLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, courseId))
        .orderBy(asc(lessons.position));

      res.json({
        courseId,
        lessonsCount: allLessons.length,
        lessons: allLessons,
      });
    } catch (e: any) {
      res.json({ error: e.message, stack: e.stack });
    }
  });

  // Temporary endpoint to create a test lesson (FOR TESTING ONLY)
  app.post("/api/debug/create-lesson", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { lessons } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) return res.json({ error: "DB not available" });

      const { courseId, title, bunnyVideoId, bunnyLibraryId, position, isPreview } = req.body;

      // Validate required fields
      if (!courseId || !title || !bunnyVideoId || !bunnyLibraryId || !position) {
        return res.status(400).json({
          error: "Missing required fields: courseId, title, bunnyVideoId, bunnyLibraryId, position"
        });
      }

      // Insert the lesson
      await db.insert(lessons).values({
        courseId: parseInt(courseId),
        title,
        description: "Lección de prueba creada automáticamente",
        videoUrl: null, // Deprecated
        bunnyVideoId,
        bunnyLibraryId,
        position: parseInt(position),
        durationSeconds: null,
        isPreview: isPreview ?? true, // Make it free by default
      });

      res.json({
        success: true,
        message: "Lesson created successfully!",
        data: { courseId, title, bunnyVideoId, bunnyLibraryId, position }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, stack: e.stack });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Koyeb and other hosting providers set PORT environment variable
  // In production, use PORT directly without searching for alternative ports
  const preferredPort = parseInt(process.env.PORT || "3000");
  const isProduction = process.env.NODE_ENV === "production";
  const port = isProduction ? preferredPort : await findAvailablePort(preferredPort);

  // Set server timeout to 10 minutes for video uploads
  server.timeout = 600000; // 10 minutes
  server.keepAliveTimeout = 610000; // 10 min + 10 seconds
  server.headersTimeout = 620000; // 10 min + 20 seconds

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Auto-seed default email templates and start scheduled campaign processor after server starts
  server.once("listening", () => {
    setTimeout(async () => {
      // Idempotent schema migrations (safe to re-run on every boot)
      try {
        const { getDb } = await import("../db");
        const { sql } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          const autoMigrations = [
            `ALTER TABLE "eventTickets" ADD COLUMN IF NOT EXISTS "guestName" VARCHAR(255)`,
            `ALTER TABLE "eventTickets" ADD COLUMN IF NOT EXISTS "guestEmail" VARCHAR(320)`,
            `ALTER TABLE "eventTickets" ADD COLUMN IF NOT EXISTS "guestAddedBy" INTEGER`,
            `CREATE TABLE IF NOT EXISTS "passwordResetTokens" (
              "id" SERIAL PRIMARY KEY,
              "userId" INTEGER NOT NULL,
              "token" VARCHAR(128) NOT NULL UNIQUE,
              "expiresAt" TIMESTAMP NOT NULL,
              "usedAt" TIMESTAMP,
              "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )`,
            `CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "passwordResetTokens" ("token")`,
            `CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx" ON "passwordResetTokens" ("userId")`,
          ];
          for (const q of autoMigrations) {
            try {
              await db.execute(sql.raw(q));
            } catch (migErr) {
              console.error(`[Migration] Failed: ${q}`, migErr);
            }
          }
          console.log("[Migration] Guest list columns ensured on eventTickets");
        }
      } catch (err) {
        console.error("[Migration] Auto-migration error:", err);
      }

      try {
        const { seedDefaultEmailTemplates } = await import("../features/emailMarketing");
        await seedDefaultEmailTemplates();
      } catch (err) {
        console.error("[EmailMarketing] Failed to auto-seed templates:", err);
      }

      console.log("[Server] Starting scheduled campaign processor...");
      try {
        const { startScheduledCampaignProcessor } = await import("../features/scheduledCampaigns");
        const intervalHandle = startScheduledCampaignProcessor();
        console.log("[Server] ✅ Scheduled campaign processor started successfully (interval handle:", typeof intervalHandle, ")");
      } catch (err) {
        console.error("[Server] ❌ Failed to start scheduled campaign processor:", err);
        console.error("[Server] Error stack:", err instanceof Error ? err.stack : "No stack trace");
      }
    }, 2000); // small delay to ensure DB is ready
  });
}

startServer().catch(console.error);
