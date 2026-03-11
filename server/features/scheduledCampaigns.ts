/**
 * Scheduled Campaign Processor
 * Runs every 5 minutes to send campaigns whose scheduledAt time has passed.
 * Called from server/_core/index.ts on startup.
 */
import { getDb } from "../db";
import { emailCampaigns, crmContacts } from "../../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { sendEmail } from "./email";
import { buildUnsubscribeUrl } from "./emailTracking";

const APP_BASE_URL = process.env.APP_BASE_URL || "https://consabor.uk";

/**
 * Process a single campaign: send to all matching contacts and mark as sent.
 */
export async function processCampaign(campaignId: number): Promise<{ sent: number; errors: string[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [campaign] = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);

  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
  if (campaign.status === "sent" || campaign.status === "sending") {
    return { sent: 0, errors: [] };
  }

  // Fetch contacts based on segment
  let contacts;
  if (campaign.segment === "all") {
    contacts = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.status, "active"));
  } else {
    contacts = await db
      .select()
      .from(crmContacts)
      .where(
        and(
          eq(crmContacts.status, "active"),
          eq(crmContacts.segment, campaign.segment as any)
        )
      );
  }

  // Mark as sending
  await db
    .update(emailCampaigns)
    .set({ status: "sending", totalRecipients: contacts.length })
    .where(eq(emailCampaigns.id, campaignId));

  let sent = 0;
  const errors: string[] = [];

  for (const contact of contacts) {
    try {
      const trackingPixel = `<img src="${APP_BASE_URL}/api/email/track/open/${campaign.id}/${contact.id}" width="1" height="1" style="display:none" alt="" />`;
          const unsubscribeUrl = buildUnsubscribeUrl(APP_BASE_URL, contact.id);
          let htmlWithUnsub = campaign.htmlContent.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
          if (!campaign.htmlContent.includes("{{unsubscribeUrl}}")) {
            htmlWithUnsub += `\n<div style="font-family:Arial,sans-serif;text-align:center;padding:16px;font-size:12px;color:#666;border-top:1px solid #222;margin-top:24px">Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color:#999">Unsubscribe</a></div>`;
          }
          const trackedContent = htmlWithUnsub + trackingPixel;

          await sendEmail({
        to: contact.email,
        subject: campaign.subject,
        htmlContent: trackedContent,
      });
      sent++;
    } catch (err) {
      errors.push(`${contact.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  // Mark as sent
  await db
    .update(emailCampaigns)
    .set({
      status: "sent",
      sentAt: new Date(),
      totalSent: sent,
    })
    .where(eq(emailCampaigns.id, campaignId));

  return { sent, errors };
}

/**
 * Find all scheduled campaigns whose scheduledAt <= now and send them.
 */
export async function processScheduledCampaigns(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  const due = await db
    .select({ id: emailCampaigns.id, name: emailCampaigns.name })
    .from(emailCampaigns)
    .where(
      and(
        eq(emailCampaigns.status, "scheduled"),
        isNotNull(emailCampaigns.scheduledAt),
        lte(emailCampaigns.scheduledAt, now)
      )
    );

  if (due.length === 0) return;

  console.log(`[ScheduledCampaigns] Processing ${due.length} due campaign(s)...`);

  for (const campaign of due) {
    try {
      const result = await processCampaign(campaign.id);
      console.log(`[ScheduledCampaigns] Campaign "${campaign.name}" (id=${campaign.id}): sent=${result.sent}, errors=${result.errors.length}`);
    } catch (err) {
      console.error(`[ScheduledCampaigns] Failed to process campaign ${campaign.id}:`, err);
    }
  }
}

/**
 * Start the cron job: runs processScheduledCampaigns every 5 minutes.
 * Returns the interval handle so it can be cleared in tests.
 */
export function startScheduledCampaignProcessor(): ReturnType<typeof setInterval> {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  console.log("[ScheduledCampaigns] Processor started (interval: 5 min)");

  // Run once immediately on startup to catch any campaigns that fired while server was down
  processScheduledCampaigns().catch((err) =>
    console.error("[ScheduledCampaigns] Initial run error:", err)
  );

  return setInterval(() => {
    processScheduledCampaigns().catch((err) =>
      console.error("[ScheduledCampaigns] Interval run error:", err)
    );
  }, INTERVAL_MS);
}
