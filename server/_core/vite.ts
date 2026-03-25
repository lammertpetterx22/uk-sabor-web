import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, node dist/index.js runs from project root
  // So dist/public is accessible via process.cwd() + dist/public
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),         // Primary: from project root (Koyeb, Docker)
    path.resolve(import.meta.dirname, "public"),           // Secondary: when running from dist/
    path.resolve(import.meta.dirname, "../..", "dist", "public"), // Fallback: development
  ];

  let distPath = possiblePaths[0];

  // Find the first path that exists
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      break;
    }
  }

  console.log(`[Static Files] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Static Files] import.meta.dirname: ${import.meta.dirname}`);
  console.log(`[Static Files] process.cwd(): ${process.cwd()}`);
  console.log(`[Static Files] Checked paths:`, possiblePaths);
  console.log(`[Static Files] Selected path: ${distPath}`);
  console.log(`[Static Files] Directory exists: ${fs.existsSync(distPath)}`);

  if (!fs.existsSync(distPath)) {
    console.error(
      `❌ Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    // List what's actually in import.meta.dirname
    try {
      const files = fs.readdirSync(import.meta.dirname);
      console.log(`[Static Files] Contents of ${import.meta.dirname}:`, files);
    } catch (e) {
      console.error('[Static Files] Could not read directory:', e);
    }
  } else {
    console.log(`✅ [Static Files] Successfully found build directory`);
  }

  // Serve static files with proper MIME types and cache control
  app.use(express.static(distPath, {
    maxAge: 0, // Don't set default maxAge - we'll handle it per file type
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Set proper MIME types and cache policies
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for hashed JS
      } else if (filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for hashed JS
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for hashed CSS
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Never cache HTML
        res.setHeader('Pragma', 'no-cache'); // HTTP/1.0 compatibility
        res.setHeader('Expires', '0'); // Proxies
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache'); // Don't cache JSON
      } else if (filePath.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for images
      } else if (filePath.match(/\.(woff|woff2|ttf|eot)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for fonts
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour default
      }
    }
  }));

  // SPA fallback: serve index.html for all non-API, non-asset routes
  app.use("*", (req, res, next) => {
    // Don't serve index.html for API routes or static assets
    if (req.originalUrl.startsWith('/api/') ||
        req.originalUrl.startsWith('/assets/') ||
        req.originalUrl.includes('.')) {
      // If we get here, the file doesn't exist - return 404
      return res.status(404).json({ error: 'Not found' });
    }

    // For all other routes, serve the React app (SPA)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
