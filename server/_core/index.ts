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
  const { handleStripeWebhook } = await import("../features/stripe-webhook");
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

      const queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripeCustomerId VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripeAccountId VARCHAR(255)",
        // Add Bunny.net columns to lessons table
        "ALTER TABLE lessons ADD COLUMN IF NOT EXISTS bunnyVideoId VARCHAR(255)",
        "ALTER TABLE lessons ADD COLUMN IF NOT EXISTS bunnyLibraryId VARCHAR(255)",
      ];

      let results = [];
      for (const q of queries) {
        try {
          await db.execute(sql.raw(q));
          results.push(`✅ Success: ${q}`);
        } catch (e: any) {
          console.error("MIGRATION ERROR details:", e);
          results.push(`⚠️ Skipped/Failed: ${q} - ${e.message}`);
        }
      }
      res.json({
        success: true,
        results,
        message: "Migration complete! The lessons table now has bunnyVideoId and bunnyLibraryId columns."
      });
    } catch (e: any) {
      res.json({
        success: false,
        error: e.message
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

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

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
      try {
        const { seedDefaultEmailTemplates } = await import("../features/emailMarketing");
        await seedDefaultEmailTemplates();
      } catch (err) {
        console.error("[EmailMarketing] Failed to auto-seed templates:", err);
      }

      try {
        const { startScheduledCampaignProcessor } = await import("../features/scheduledCampaigns");
        startScheduledCampaignProcessor();
      } catch (err) {
        console.error("[ScheduledCampaigns] Failed to start processor:", err);
      }
    }, 2000); // small delay to ensure DB is ready
  });
}

startServer().catch(console.error);
