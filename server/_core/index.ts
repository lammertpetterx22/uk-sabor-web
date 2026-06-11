import "dotenv/config";
import express from "express";
import { createServer } from "http";
import https from "https";
import fs from "fs";
import net from "net";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerEmailTrackingRoutes } from "../features/emailTracking";
import { sdk } from "./sdk";

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

  // Configure body parser with larger size limit for normal API calls
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── Chunked video upload (browser → temp file → Bunny.net PUT) ──────────────
  // Browser sends 20MB chunks → server writes to /tmp file (avoids proxy limits).
  // When the last chunk arrives, the server streams the assembled temp file to
  // Bunny.net via a regular PUT (no TUS auth complexity).
  interface UploadSession {
    videoId: string;
    libraryId: string;
    tempPath: string;
    totalSize: number;
    bytesReceived: number;
  }
  const uploadSessions = new Map<string, UploadSession>();

  // Step 1 — Init: create Bunny video entry and a local temp file for this upload
  app.post("/api/upload-video-init", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user || (user.role !== "admin" && user.role !== "instructor")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let title = "Untitled";
      const titleHeader = req.headers["x-video-title"];
      if (typeof titleHeader === "string") {
        try { title = decodeURIComponent(titleHeader); } catch { title = titleHeader; }
      }
      const totalSizeStr = req.headers["x-video-size"];
      const totalSize = totalSizeStr ? parseInt(String(totalSizeStr)) : 0;
      if (!totalSize || isNaN(totalSize)) {
        return res.status(400).json({ error: "Missing or invalid X-Video-Size header" });
      }

      const { bunnyCreateVideo } = await import("../bunny");
      const { videoId, libraryId } = await bunnyCreateVideo(title);

      const tempPath = `/tmp/bunny-upload-${videoId}.tmp`;
      await fs.promises.writeFile(tempPath, Buffer.alloc(0));

      uploadSessions.set(videoId, { videoId, libraryId, tempPath, totalSize, bytesReceived: 0 });
      console.log(`[Upload] Session started: ${videoId} (${Math.round(totalSize / 1024 / 1024)}MB)`);

      return res.json({ videoId, libraryId });
    } catch (err: any) {
      console.error("[Upload] Init error:", err.message);
      return res.status(500).json({ error: err.message || "Init failed" });
    }
  });

  // Step 2 — Chunk: append binary chunk to temp file, stream to Bunny on last chunk
  app.post(
    "/api/upload-video-chunk",
    express.raw({ type: "application/octet-stream", limit: "30mb" }),
    async (req, res) => {
      // Long timeout for the final chunk which triggers the Bunny PUT
      req.setTimeout(0);
      res.setTimeout(0);
      try {
        const user = await sdk.authenticateRequest(req);
        if (!user || (user.role !== "admin" && user.role !== "instructor")) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const videoId = String(req.headers["x-video-id"] || "");
        if (!videoId) return res.status(400).json({ error: "Missing X-Video-Id" });

        const session = uploadSessions.get(videoId);
        if (!session) {
          return res.status(404).json({ error: "Upload session not found. Please restart the upload." });
        }

        const data = req.body as Buffer;
        if (!Buffer.isBuffer(data) || data.length === 0) {
          return res.status(400).json({ error: "Empty chunk body" });
        }

        // Append this chunk to the temp file
        await fs.promises.appendFile(session.tempPath, data);
        session.bytesReceived += data.length;

        const isLastChunk = session.bytesReceived >= session.totalSize;

        if (isLastChunk) {
          uploadSessions.delete(videoId);
          console.log(`[Upload] All chunks received for ${videoId} — streaming to Bunny.net…`);

          // Stream temp file directly to Bunny via their standard PUT endpoint
          await new Promise<void>((resolve, reject) => {
            const bunnyReq = https.request(
              {
                hostname: "video.bunnycdn.com",
                path: `/library/${session.libraryId}/videos/${session.videoId}`,
                method: "PUT",
                timeout: 0,
                headers: {
                  AccessKey: process.env.BUNNY_API_KEY || "",
                  "Content-Type": "application/octet-stream",
                  "Content-Length": String(session.bytesReceived),
                },
              },
              (bunnyRes) => {
                let body = "";
                bunnyRes.on("data", (c) => (body += c));
                bunnyRes.on("end", () => {
                  if (bunnyRes.statusCode && bunnyRes.statusCode >= 200 && bunnyRes.statusCode < 300) {
                    console.log(`[Upload] ✅ Bunny PUT complete: ${videoId}`);
                    resolve();
                  } else {
                    reject(new Error(`Bunny PUT failed: ${bunnyRes.statusCode} ${body}`));
                  }
                });
              }
            );
            bunnyReq.on("error", reject);
            const fileStream = fs.createReadStream(session.tempPath);
            fileStream.on("error", reject);
            fileStream.pipe(bunnyReq);
          });

          // Clean up temp file
          await fs.promises.unlink(session.tempPath).catch(() => {});

          return res.json({ success: true, done: true });
        }

        return res.json({ success: true, done: false });
      } catch (err: any) {
        console.error("[Upload] Chunk error:", err.message);
        return res.status(500).json({ error: err.message || "Chunk upload failed" });
      }
    }
  );

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
            // Stripe Connect columns on users
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" VARCHAR(255)`,
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeAccountId" VARCHAR(255)`,
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeAccountStatus" VARCHAR(32) DEFAULT 'none'`,
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeChargesEnabled" BOOLEAN DEFAULT false`,
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripePayoutsEnabled" BOOLEAN DEFAULT false`,
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeOnboardedAt" TIMESTAMP`,
            // RRP tables
            `CREATE TABLE IF NOT EXISTS "rrpApplications" (
              "id" SERIAL PRIMARY KEY,
              "userId" INTEGER NOT NULL UNIQUE,
              "motivation" TEXT,
              "socialHandle" VARCHAR(255),
              "phone" VARCHAR(32),
              "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
              "adminNotes" TEXT,
              "reviewedBy" INTEGER,
              "reviewedAt" TIMESTAMP,
              "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )`,
            `CREATE INDEX IF NOT EXISTS "rrp_applications_status_idx" ON "rrpApplications" ("status")`,
            `CREATE TABLE IF NOT EXISTS "rrpProfiles" (
              "id" SERIAL PRIMARY KEY,
              "userId" INTEGER NOT NULL UNIQUE,
              "code" VARCHAR(32) NOT NULL UNIQUE,
              "tier" VARCHAR(20) NOT NULL DEFAULT 'bronze',
              "lifetimeSales" INTEGER NOT NULL DEFAULT 0,
              "lifetimeEarnings" DECIMAL(10,2) NOT NULL DEFAULT '0.00',
              "active" BOOLEAN NOT NULL DEFAULT true,
              "approvedBy" INTEGER,
              "approvedAt" TIMESTAMP NOT NULL DEFAULT now()
            )`,
            `CREATE INDEX IF NOT EXISTS "rrp_profiles_code_idx" ON "rrpProfiles" ("code")`,
            `CREATE TABLE IF NOT EXISTS "eventRrps" (
              "id" SERIAL PRIMARY KEY,
              "eventId" INTEGER NOT NULL,
              "rrpUserId" INTEGER NOT NULL,
              "customerDiscountPct" INTEGER NOT NULL DEFAULT 0,
              "rrpCommissionPct" INTEGER NOT NULL,
              "active" BOOLEAN NOT NULL DEFAULT true,
              "assignedBy" INTEGER,
              "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )`,
            `CREATE INDEX IF NOT EXISTS "event_rrps_event_rrp_idx" ON "eventRrps" ("eventId","rrpUserId")`,
            `CREATE INDEX IF NOT EXISTS "event_rrps_event_idx" ON "eventRrps" ("eventId")`,
            `CREATE INDEX IF NOT EXISTS "event_rrps_rrp_idx" ON "eventRrps" ("rrpUserId")`,
            `CREATE TABLE IF NOT EXISTS "rrpSales" (
              "id" SERIAL PRIMARY KEY,
              "rrpUserId" INTEGER NOT NULL,
              "eventId" INTEGER NOT NULL,
              "orderId" INTEGER,
              "buyerUserId" INTEGER NOT NULL,
              "ticketPrice" DECIMAL(10,2) NOT NULL,
              "customerDiscount" DECIMAL(10,2) NOT NULL,
              "rrpCommission" DECIMAL(10,2) NOT NULL,
              "commissionPct" INTEGER NOT NULL,
              "creditedToBalance" BOOLEAN NOT NULL DEFAULT false,
              "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )`,
            `CREATE INDEX IF NOT EXISTS "rrp_sales_rrp_idx" ON "rrpSales" ("rrpUserId")`,
            `CREATE INDEX IF NOT EXISTS "rrp_sales_event_idx" ON "rrpSales" ("eventId")`,
            // Multi-tier event tickets
            `CREATE TABLE IF NOT EXISTS "eventTicketTiers" (
              "id" SERIAL PRIMARY KEY,
              "eventId" INTEGER NOT NULL,
              "name" VARCHAR(255) NOT NULL,
              "description" TEXT,
              "price" DECIMAL(10,2) NOT NULL,
              "maxQuantity" INTEGER,
              "soldCount" INTEGER NOT NULL DEFAULT 0,
              "position" INTEGER NOT NULL DEFAULT 0,
              "active" BOOLEAN NOT NULL DEFAULT true,
              "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
              "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )`,
            `CREATE INDEX IF NOT EXISTS "event_ticket_tiers_event_idx" ON "eventTicketTiers" ("eventId")`,
            `ALTER TABLE "eventTickets" ADD COLUMN IF NOT EXISTS "tierId" INTEGER`,
            `CREATE INDEX IF NOT EXISTS "event_tickets_tier_id_idx" ON "eventTickets" ("tierId")`,
            // Multi-tier class tickets
            `CREATE TABLE IF NOT EXISTS "classTicketTiers" (
              "id" SERIAL PRIMARY KEY,
              "classId" INTEGER NOT NULL,
              "name" VARCHAR(255) NOT NULL,
              "description" TEXT,
              "price" DECIMAL(10,2) NOT NULL,
              "maxQuantity" INTEGER,
              "soldCount" INTEGER NOT NULL DEFAULT 0,
              "position" INTEGER NOT NULL DEFAULT 0,
              "active" BOOLEAN NOT NULL DEFAULT true,
              "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
              "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )`,
            `CREATE INDEX IF NOT EXISTS "class_ticket_tiers_class_idx" ON "classTicketTiers" ("classId")`,
            `ALTER TABLE "classPurchases" ADD COLUMN IF NOT EXISTS "tierId" INTEGER`,
            `CREATE INDEX IF NOT EXISTS "class_purchases_tier_id_idx" ON "classPurchases" ("tierId")`,
            // Per-tier discount code scoping
            `ALTER TABLE "discountCodes" ADD COLUMN IF NOT EXISTS "eventTierId" INTEGER`,
            `ALTER TABLE "discountCodes" ADD COLUMN IF NOT EXISTS "classTierId" INTEGER`,
            // Event partner hotels
            `CREATE TABLE IF NOT EXISTS "eventHotels" (
              "id" SERIAL PRIMARY KEY,
              "eventId" INTEGER NOT NULL,
              "name" VARCHAR(255) NOT NULL,
              "description" TEXT,
              "imageUrl" TEXT,
              "bookingUrl" TEXT NOT NULL,
              "discountCode" VARCHAR(80),
              "priceFromGBP" DECIMAL(10,2),
              "distanceKm" DECIMAL(6,2),
              "position" INTEGER NOT NULL DEFAULT 0,
              "active" BOOLEAN NOT NULL DEFAULT true,
              "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
              "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )`,
            `CREATE INDEX IF NOT EXISTS "event_hotels_event_idx" ON "eventHotels" ("eventId")`,
            // Per-tier post-purchase info (hotel bundle instructions, etc.)
            `ALTER TABLE "eventTicketTiers" ADD COLUMN IF NOT EXISTS "postPurchaseInfo" TEXT`,
            `ALTER TABLE "classTicketTiers" ADD COLUMN IF NOT EXISTS "postPurchaseInfo" TEXT`,
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
