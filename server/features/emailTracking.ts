/**
 * Email tracking endpoints — registered directly on Express (not via tRPC)
 * because they must be publicly accessible (no auth cookie) and return
 * non-JSON responses (1x1 GIF pixel, HTTP redirects, HTML confirmation pages).
 */
import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import {
  emailOpens,
  emailClicks,
  emailCampaigns,
  crmContacts,
} from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

/** Generate an HMAC-SHA256 unsubscribe token for a contact ID */
export function generateUnsubscribeToken(contactId: number): string {
  const secret = process.env.JWT_SECRET || "sabor-unsubscribe-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(String(contactId))
    .digest("hex")
    .slice(0, 32);
}

/** Build the full unsubscribe URL for a contact */
export function buildUnsubscribeUrl(baseUrl: string, contactId: number): string {
  const token = generateUnsubscribeToken(contactId);
  return `${baseUrl}/api/email/unsubscribe/${contactId}/${token}`;
}

// 1×1 transparent GIF — the smallest possible tracking pixel
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export function registerEmailTrackingRoutes(app: Express) {
  /**
   * GET /api/email/track/open/:campaignId/:contactId
   * Returns a 1×1 transparent GIF and records the open event.
   */
  app.get(
    "/api/email/track/open/:campaignId/:contactId",
    async (req: Request, res: Response) => {
      const campaignId = parseInt(req.params.campaignId, 10);
      const contactId = parseInt(req.params.contactId, 10);

      // Always respond immediately so email clients don't hang
      res.set({
        "Content-Type": "image/gif",
        "Content-Length": String(TRACKING_PIXEL.length),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });
      res.end(TRACKING_PIXEL);

      // Record asynchronously — don't block the response
      if (!isNaN(campaignId) && !isNaN(contactId)) {
        try {
          const db = await getDb();
          if (!db) return;

          await db.insert(emailOpens).values({
            campaignId,
            contactId,
            ipAddress: req.ip?.slice(0, 45) ?? null,
            userAgent: (req.headers["user-agent"] ?? "").slice(0, 512),
          });

          await db
            .update(emailCampaigns)
            .set({ totalOpened: sql`totalOpened + 1` })
            .where(eq(emailCampaigns.id, campaignId));
        } catch (err) {
          // Silently ignore — tracking should never break email delivery
          console.error("[EmailTracking] open error:", err);
        }
      }
    }
  );

  /**
   * GET /api/email/track/click/:campaignId/:contactId?url=<encoded-url>
   * Records the click and redirects to the target URL.
   */
  app.get(
    "/api/email/track/click/:campaignId/:contactId",
    async (req: Request, res: Response) => {
      const campaignId = parseInt(req.params.campaignId, 10);
      const contactId = parseInt(req.params.contactId, 10);
      const targetUrl = (req.query.url as string) || "/";

      // Redirect immediately
      res.redirect(302, targetUrl);

      // Record asynchronously
      if (!isNaN(campaignId) && !isNaN(contactId)) {
        try {
          const db = await getDb();
          if (!db) return;

          await db.insert(emailClicks).values({
            campaignId,
            contactId,
            url: targetUrl.slice(0, 2048),
            ipAddress: req.ip?.slice(0, 45) ?? null,
          });

          await db
            .update(emailCampaigns)
            .set({ totalClicked: sql`totalClicked + 1` })
            .where(eq(emailCampaigns.id, campaignId));
        } catch (err) {
          console.error("[EmailTracking] click error:", err);
        }
      }
    }
  );

  /**
   * GET /api/email/unsubscribe/:contactId/:token
   * One-click unsubscribe: validates HMAC token, marks contact as unsubscribed,
   * and returns a friendly HTML confirmation page.
   */
  app.get(
    "/api/email/unsubscribe/:contactId/:token",
    async (req: Request, res: Response) => {
      const contactId = parseInt(req.params.contactId, 10);
      const token = req.params.token;

      if (isNaN(contactId) || !token) {
        return res.status(400).send(unsubscribeHtml("Invalid unsubscribe link.", false));
      }

      // Validate HMAC token
      const expectedToken = generateUnsubscribeToken(contactId);
      if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
        return res.status(400).send(unsubscribeHtml("Invalid or expired unsubscribe link.", false));
      }

      try {
        const db = await getDb();
        if (!db) return res.status(500).send(unsubscribeHtml("Service temporarily unavailable.", false));

        // Mark contact as unsubscribed
        const [contact] = await db
          .select({ id: crmContacts.id, email: crmContacts.email, status: crmContacts.status })
          .from(crmContacts)
          .where(eq(crmContacts.id, contactId))
          .limit(1);

        if (!contact) {
          return res.status(404).send(unsubscribeHtml("Contact not found.", false));
        }

        if (contact.status === "unsubscribed") {
          return res.send(unsubscribeHtml(`${contact.email} is already unsubscribed.`, true));
        }

        await db
          .update(crmContacts)
          .set({ status: "unsubscribed" })
          .where(eq(crmContacts.id, contactId));

        console.log(`[EmailTracking] Contact ${contact.email} (id=${contactId}) unsubscribed.`);
        return res.send(unsubscribeHtml(`${contact.email} has been unsubscribed successfully.`, true));
      } catch (err) {
        console.error("[EmailTracking] unsubscribe error:", err);
        return res.status(500).send(unsubscribeHtml("An error occurred. Please try again.", false));
      }
    }
  );
}

/** Minimal branded HTML confirmation page for unsubscribe */
function unsubscribeHtml(message: string, success: boolean): string {
  const color = success ? "#22c55e" : "#ef4444";
  const icon = success ? "✓" : "✗";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribe — UK Sabor</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #111; border: 1px solid #222; border-radius: 12px; padding: 48px 40px; text-align: center; max-width: 420px; }
    .icon { font-size: 48px; color: ${color}; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #aaa; line-height: 1.6; margin: 0 0 24px; }
    a { color: #e91e8c; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${success ? "Unsubscribed" : "Error"}</h1>
    <p>${message}</p>
    <a href="/">← Back to UK Sabor</a>
  </div>
</body>
</html>`;
}
