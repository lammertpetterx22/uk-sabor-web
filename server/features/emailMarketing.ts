import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  emailTemplates,
  emailCampaigns,
  emailOpens,
  emailClicks,
  crmContacts,
} from "../../drizzle/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { sendEmail } from "./email";
import { buildUnsubscribeUrl } from "./emailTracking";

// ─── Default templates seeded on first load ───────────────────────────────────
export const DEFAULT_TEMPLATES = [
  {
    name: "New Event Announcement",
    category: "event" as const,
    subject: "🎉 New Event: {{eventTitle}}",
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#e91e8c,#ff6b35);padding:40px 32px;text-align:center">
    <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px">🎉 New Event!</h1>
  </div>
  <div style="padding:32px">
    <h2 style="color:#e91e8c;margin-top:0">{{eventTitle}}</h2>
    <p style="color:#cccccc;line-height:1.6">{{eventDescription}}</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0">
      <tr><td style="padding:8px 0;color:#999;width:120px">📅 Date</td><td style="color:#fff">{{eventDate}}</td></tr>
      <tr><td style="padding:8px 0;color:#999">📍 Venue</td><td style="color:#fff">{{eventVenue}}</td></tr>
      <tr><td style="padding:8px 0;color:#999">🎟️ Price</td><td style="color:#e91e8c;font-weight:bold">£{{eventPrice}}</td></tr>
    </table>
    <div style="text-align:center;margin-top:32px">
      <a href="{{eventUrl}}" style="background:linear-gradient(135deg,#e91e8c,#ff6b35);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Get Your Tickets →</a>
    </div>
  </div>
  <div style="padding:24px 32px;border-top:1px solid #222;text-align:center;color:#666;font-size:12px">
    <p>UK Sabor · Latin Dance Events & Courses · <a href="{{unsubscribeUrl}}" style="color:#666">Unsubscribe</a></p>
  </div>
</div>`,
    isDefault: true,
  },
  {
    name: "New Course Launch",
    category: "course" as const,
    subject: "🎓 New Course: {{courseTitle}}",
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px 32px;text-align:center">
    <h1 style="margin:0;font-size:28px;font-weight:900">🎓 New Course Available!</h1>
  </div>
  <div style="padding:32px">
    <h2 style="color:#818cf8;margin-top:0">{{courseTitle}}</h2>
    <p style="color:#cccccc;line-height:1.6">{{courseDescription}}</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0">
      <tr><td style="padding:8px 0;color:#999;width:120px">💃 Style</td><td style="color:#fff">{{danceStyle}}</td></tr>
      <tr><td style="padding:8px 0;color:#999">📊 Level</td><td style="color:#fff">{{level}}</td></tr>
      <tr><td style="padding:8px 0;color:#999">💰 Price</td><td style="color:#818cf8;font-weight:bold">£{{price}}</td></tr>
    </table>
    <div style="text-align:center;margin-top:32px">
      <a href="{{courseUrl}}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Enrol Now →</a>
    </div>
  </div>
  <div style="padding:24px 32px;border-top:1px solid #222;text-align:center;color:#666;font-size:12px">
    <p>UK Sabor · Latin Dance Events & Courses · <a href="{{unsubscribeUrl}}" style="color:#666">Unsubscribe</a></p>
  </div>
</div>`,
    isDefault: true,
  },
  {
    name: "Class Booking Reminder",
    category: "class" as const,
    subject: "💃 Don't miss {{classTitle}} this {{classDay}}!",
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 32px;text-align:center">
    <h1 style="margin:0;font-size:28px;font-weight:900">💃 Class This Week!</h1>
  </div>
  <div style="padding:32px">
    <h2 style="color:#34d399;margin-top:0">{{classTitle}}</h2>
    <p style="color:#cccccc;line-height:1.6">{{classDescription}}</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0">
      <tr><td style="padding:8px 0;color:#999;width:120px">📅 When</td><td style="color:#fff">{{classDate}}</td></tr>
      <tr><td style="padding:8px 0;color:#999">📍 Where</td><td style="color:#fff">{{classVenue}}</td></tr>
      <tr><td style="padding:8px 0;color:#999">🎯 Level</td><td style="color:#fff">{{level}}</td></tr>
      <tr><td style="padding:8px 0;color:#999">💰 Price</td><td style="color:#34d399;font-weight:bold">£{{price}}</td></tr>
    </table>
    <div style="text-align:center;margin-top:32px">
      <a href="{{classUrl}}" style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Book Your Spot →</a>
    </div>
  </div>
  <div style="padding:24px 32px;border-top:1px solid #222;text-align:center;color:#666;font-size:12px">
    <p>UK Sabor · Latin Dance Events & Courses · <a href="{{unsubscribeUrl}}" style="color:#666">Unsubscribe</a></p>
  </div>
</div>`,
    isDefault: true,
  },
  {
    name: "Flash Sale",
    category: "promotion" as const,
    subject: "⚡ Flash Sale: {{discountPercent}}% off – Today Only!",
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#dc2626,#f97316);padding:40px 32px;text-align:center">
    <p style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:2px;opacity:0.8">Limited Time</p>
    <h1 style="margin:0;font-size:48px;font-weight:900">⚡ {{discountPercent}}% OFF</h1>
    <p style="margin:8px 0 0;font-size:18px;opacity:0.9">Today Only!</p>
  </div>
  <div style="padding:32px">
    <h2 style="color:#fb923c;margin-top:0">{{saleTitle}}</h2>
    <p style="color:#cccccc;line-height:1.6">{{saleDescription}}</p>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;text-align:center;margin:24px 0">
      <p style="margin:0 0 4px;color:#999;font-size:12px;text-transform:uppercase">Use code</p>
      <p style="margin:0;font-size:24px;font-weight:900;color:#fb923c;letter-spacing:4px">{{promoCode}}</p>
    </div>
    <div style="text-align:center;margin-top:32px">
      <a href="{{saleUrl}}" style="background:linear-gradient(135deg,#dc2626,#f97316);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Claim Your Discount →</a>
    </div>
    <p style="color:#666;font-size:12px;text-align:center;margin-top:16px">Offer expires at midnight. Terms apply.</p>
  </div>
  <div style="padding:24px 32px;border-top:1px solid #222;text-align:center;color:#666;font-size:12px">
    <p>UK Sabor · Latin Dance Events & Courses · <a href="{{unsubscribeUrl}}" style="color:#666">Unsubscribe</a></p>
  </div>
</div>`,
    isDefault: true,
  },
  {
    name: "Monthly Newsletter",
    category: "newsletter" as const,
    subject: "💃 UK Sabor Monthly Update – {{month}} {{year}}",
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#e91e8c,#ff6b35,#f59e0b);padding:40px 32px;text-align:center">
    <h1 style="margin:0;font-size:28px;font-weight:900">💃 UK Sabor Monthly Update</h1>
    <p style="margin:8px 0 0;opacity:0.9">{{month}} {{year}}</p>
  </div>
  <div style="padding:32px">
    <h2 style="color:#e91e8c;margin-top:0">What's New at UK Sabor</h2>
    <p style="color:#cccccc;line-height:1.6">{{newsletterIntro}}</p>
    
    <h3 style="color:#ff6b35;border-bottom:1px solid #222;padding-bottom:8px">🎉 Upcoming Events</h3>
    <p style="color:#cccccc">{{upcomingEvents}}</p>
    
    <h3 style="color:#ff6b35;border-bottom:1px solid #222;padding-bottom:8px">🎓 New Courses</h3>
    <p style="color:#cccccc">{{newCourses}}</p>
    
    <h3 style="color:#ff6b35;border-bottom:1px solid #222;padding-bottom:8px">💃 Weekly Classes</h3>
    <p style="color:#cccccc">{{weeklyClasses}}</p>
    
    <div style="text-align:center;margin-top:32px">
      <a href="{{websiteUrl}}" style="background:linear-gradient(135deg,#e91e8c,#ff6b35);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Visit UK Sabor →</a>
    </div>
  </div>
  <div style="padding:24px 32px;border-top:1px solid #222;text-align:center;color:#666;font-size:12px">
    <p>UK Sabor · Latin Dance Events & Courses · <a href="{{unsubscribeUrl}}" style="color:#666">Unsubscribe</a></p>
  </div>
</div>`,
    isDefault: true,
  },
];

// ─── Standalone seeder (called on server startup) ────────────────────────────
export async function seedDefaultEmailTemplates() {
  try {
    const db = await getDb();
    if (!db) return;

    const existing = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isDefault, true));

    if (existing.length > 0) {
      console.log(`[EmailMarketing] ${existing.length} default templates already seeded.`);
      return;
    }

    for (const tpl of DEFAULT_TEMPLATES) {
      await db.insert(emailTemplates).values({
        ...tpl,
        createdBy: 1, // system user
      });
    }
    console.log(`[EmailMarketing] Seeded ${DEFAULT_TEMPLATES.length} default templates.`);
  } catch (err) {
    console.error("[EmailMarketing] Seed error:", err);
  }
}

export const emailMarketingRouter = router({
  // ─── TEMPLATES ────────────────────────────────────────────────────────────────

  listTemplates: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(desc(emailTemplates.createdAt));

    return templates;
  }),

  seedDefaultTemplates: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if defaults already exist
    const existing = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isDefault, true));

    if (existing.length > 0) {
      return { seeded: 0, message: "Default templates already exist" };
    }

    // Insert all defaults
    for (const tpl of DEFAULT_TEMPLATES) {
      await db.insert(emailTemplates).values({
        ...tpl,
        createdBy: ctx.user.id,
      });
    }

    return { seeded: DEFAULT_TEMPLATES.length, message: "Default templates seeded" };
  }),

  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(["event", "course", "class", "promotion", "newsletter", "custom"]),
        subject: z.string().min(1),
        htmlContent: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .insert(emailTemplates)
        .values({ ...input, createdBy: ctx.user.id, isDefault: false });

      return { id: (template as any).insertId };
    }),

  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z.enum(["event", "course", "class", "promotion", "newsletter", "custom"]).optional(),
        subject: z.string().min(1).optional(),
        htmlContent: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;
      await db.update(emailTemplates).set(updates).where(eq(emailTemplates.id, id));
      return { success: true };
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Prevent deleting default templates
      const [tpl] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      if (tpl?.isDefault) throw new Error("Cannot delete default templates");

      await db.delete(emailTemplates).where(eq(emailTemplates.id, input.id));
      return { success: true };
    }),

  // ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

  listCampaigns: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const campaigns = await db
      .select()
      .from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt));

    return campaigns;
  }),

  getCampaign: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [campaign] = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, input.id))
        .limit(1);

      if (!campaign) throw new Error("Campaign not found");

      // Get opens and clicks detail
      const opens = await db
        .select()
        .from(emailOpens)
        .where(eq(emailOpens.campaignId, input.id));

      const clicks = await db
        .select()
        .from(emailClicks)
        .where(eq(emailClicks.campaignId, input.id));

      // Unique openers
      const uniqueOpeners = new Set(opens.map((o) => o.contactId)).size;
      const uniqueClickers = new Set(clicks.map((c) => c.contactId)).size;

      // Click breakdown by URL
      const urlCounts: Record<string, number> = {};
      for (const click of clicks) {
        urlCounts[click.url] = (urlCounts[click.url] || 0) + 1;
      }

      return {
        ...campaign,
        uniqueOpeners,
        uniqueClickers,
        topLinks: Object.entries(urlCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([url, count]) => ({ url, count })),
      };
    }),

  createCampaign: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        htmlContent: z.string().min(1),
        templateId: z.number().optional(),
        segment: z.enum(["all", "lead", "customer", "vip", "inactive"]).default("all"),
        scheduledAt: z.string().optional(), // ISO datetime string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      const status = scheduledAt ? "scheduled" : "draft";

      const [result] = await db.insert(emailCampaigns).values({
        name: input.name,
        subject: input.subject,
        htmlContent: input.htmlContent,
        templateId: input.templateId,
        segment: input.segment,
        status,
        scheduledAt: scheduledAt || undefined,
        createdBy: ctx.user.id,
      });

      return { id: (result as any).insertId };
    }),

  sendCampaign: adminProcedure
    .input(
      z.object({
        campaignId: z.number(),
        // The frontend passes its own origin so the tracking pixel URL is always correct
        origin: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [campaign] = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, input.campaignId))
        .limit(1);

      if (!campaign) throw new Error("Campaign not found");
      if (campaign.status === "sent") throw new Error("Campaign already sent");

      // Get contacts based on segment
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

      // Update campaign status to sending
      await db
        .update(emailCampaigns)
        .set({ status: "sending", totalRecipients: contacts.length })
        .where(eq(emailCampaigns.id, input.campaignId));

      let sent = 0;
      const errors: string[] = [];
      // Use the origin passed from the frontend (always correct across environments)
      // Fall back to the known production domain
      const baseUrl = input.origin || process.env.APP_BASE_URL || "https://consabor.uk";

      for (const contact of contacts) {
        try {
          // Inject tracking pixel
          const trackingPixel = `<img src="${baseUrl}/api/email/track/open/${campaign.id}/${contact.id}" width="1" height="1" style="display:none" alt="" />`;
          // Inject per-contact unsubscribe link (replace {{unsubscribeUrl}} placeholder or append footer)
          const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, contact.id);
          let htmlWithUnsub = campaign.htmlContent.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
          // If no placeholder was found, append a standard unsubscribe footer
          if (!campaign.htmlContent.includes("{{unsubscribeUrl}}")) {
            htmlWithUnsub += `\n<div style="font-family:Arial,sans-serif;text-align:center;padding:16px;font-size:12px;color:#666;border-top:1px solid #222;margin-top:24px">
  Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color:#999">Unsubscribe</a>
</div>`;
          }
          const trackedContent = htmlWithUnsub + trackingPixel;

          await sendEmail({
            to: contact.email,
            subject: campaign.subject,
            htmlContent: trackedContent,
          });
          sent++;
        } catch (err) {
          errors.push(
            `${contact.email}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }

      // Mark campaign as sent
      await db
        .update(emailCampaigns)
        .set({
          status: "sent",
          sentAt: new Date(),
          totalSent: sent,
        })
        .where(eq(emailCampaigns.id, input.campaignId));

      return { sent, total: contacts.length, errors };
    }),

  deleteCampaign: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(emailCampaigns).where(eq(emailCampaigns.id, input.id));
      return { success: true };
    }),

  /**
   * Per-campaign detail: returns the campaign + a per-contact engagement table
   * showing who opened, who clicked, and which links they clicked.
   */
  getCampaignDetail: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch campaign
      const [campaign] = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, input.id))
        .limit(1);

      if (!campaign) throw new Error("Campaign not found");

      // Fetch all opens for this campaign (with contact info)
      const opens = await db
        .select({
          id: emailOpens.id,
          contactId: emailOpens.contactId,
          openedAt: emailOpens.openedAt,
          ipAddress: emailOpens.ipAddress,
          contactFirstName: crmContacts.firstName,
          contactLastName: crmContacts.lastName,
          contactEmail: crmContacts.email,
        })
        .from(emailOpens)
        .leftJoin(crmContacts, eq(emailOpens.contactId, crmContacts.id))
        .where(eq(emailOpens.campaignId, input.id))
        .orderBy(desc(emailOpens.openedAt));

      // Fetch all clicks for this campaign (with contact info)
      const clicks = await db
        .select({
          id: emailClicks.id,
          contactId: emailClicks.contactId,
          clickedAt: emailClicks.clickedAt,
          url: emailClicks.url,
          contactFirstName: crmContacts.firstName,
          contactLastName: crmContacts.lastName,
          contactEmail: crmContacts.email,
        })
        .from(emailClicks)
        .leftJoin(crmContacts, eq(emailClicks.contactId, crmContacts.id))
        .where(eq(emailClicks.campaignId, input.id))
        .orderBy(desc(emailClicks.clickedAt));

      // Build per-contact summary
      const contactMap: Record<
        number,
        {
          contactId: number;
          name: string;
          email: string;
          openCount: number;
          firstOpenedAt: Date | null;
          clickCount: number;
          firstClickedAt: Date | null;
          clickedUrls: string[];
        }
      > = {};

      for (const open of opens) {
        const cid = open.contactId;
        if (!contactMap[cid]) {
          contactMap[cid] = {
            contactId: cid,
            name: [open.contactFirstName, open.contactLastName].filter(Boolean).join(" ") || "Unknown",
            email: open.contactEmail ?? "",
            openCount: 0,
            firstOpenedAt: null,
            clickCount: 0,
            firstClickedAt: null,
            clickedUrls: [],
          };
        }
        contactMap[cid].openCount++;
        if (!contactMap[cid].firstOpenedAt) {
          contactMap[cid].firstOpenedAt = open.openedAt;
        }
      }

      for (const click of clicks) {
        const cid = click.contactId;
        if (!contactMap[cid]) {
          contactMap[cid] = {
            contactId: cid,
            name: [click.contactFirstName, click.contactLastName].filter(Boolean).join(" ") || "Unknown",
            email: click.contactEmail ?? "",
            openCount: 0,
            firstOpenedAt: null,
            clickCount: 0,
            firstClickedAt: null,
            clickedUrls: [],
          };
        }
        contactMap[cid].clickCount++;
        if (!contactMap[cid].firstClickedAt) {
          contactMap[cid].firstClickedAt = click.clickedAt;
        }
        if (!contactMap[cid].clickedUrls.includes(click.url)) {
          contactMap[cid].clickedUrls.push(click.url);
        }
      }

      // URL click breakdown
      const urlCounts: Record<string, number> = {};
      for (const click of clicks) {
        urlCounts[click.url] = (urlCounts[click.url] || 0) + 1;
      }

      const topLinks = Object.entries(urlCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([url, count]) => ({ url, count }));

      const contactEngagement = Object.values(contactMap).sort(
        (a, b) => (b.openCount + b.clickCount) - (a.openCount + a.clickCount)
      );

      return {
        campaign,
        opens,
        clicks,
        contactEngagement,
        topLinks,
        uniqueOpeners: new Set(opens.map((o) => o.contactId)).size,
        uniqueClickers: new Set(clicks.map((c) => c.contactId)).size,
        openRate:
          campaign.totalSent && campaign.totalSent > 0
            ? Math.round(((campaign.totalOpened || 0) / campaign.totalSent) * 100)
            : 0,
        clickRate:
          campaign.totalSent && campaign.totalSent > 0
            ? Math.round(((campaign.totalClicked || 0) / campaign.totalSent) * 100)
            : 0,
      };
    }),

  // ─── ANALYTICS ────────────────────────────────────────────────────────────────

  getAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const campaigns = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.status, "sent"))
      .orderBy(desc(emailCampaigns.sentAt));

    const totalSent = campaigns.reduce((sum, c) => sum + (c.totalSent || 0), 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + (c.totalOpened || 0), 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + (c.totalClicked || 0), 0);

    const avgOpenRate =
      totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    const avgClickRate =
      totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

    return {
      totalCampaigns: campaigns.length,
      totalSent,
      totalOpened,
      totalClicked,
      avgOpenRate,
      avgClickRate,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        sentAt: c.sentAt,
        totalSent: c.totalSent || 0,
        totalOpened: c.totalOpened || 0,
        totalClicked: c.totalClicked || 0,
        openRate:
          c.totalSent && c.totalSent > 0
            ? Math.round(((c.totalOpened || 0) / c.totalSent) * 100)
            : 0,
        clickRate:
          c.totalSent && c.totalSent > 0
            ? Math.round(((c.totalClicked || 0) / c.totalSent) * 100)
            : 0,
      })),
    };
  }),

  // Record an open (called by tracking pixel)
  recordOpen: adminProcedure
    .input(
      z.object({
        campaignId: z.number(),
        contactId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(emailOpens).values({
        campaignId: input.campaignId,
        contactId: input.contactId,
      });

      // Increment counter
      await db
        .update(emailCampaigns)
        .set({ totalOpened: sql`totalOpened + 1` })
        .where(eq(emailCampaigns.id, input.campaignId));

      return { success: true };
    }),

  // Record a click
  recordClick: adminProcedure
    .input(
      z.object({
        campaignId: z.number(),
        contactId: z.number(),
        url: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(emailClicks).values({
        campaignId: input.campaignId,
        contactId: input.contactId,
        url: input.url,
      });

      // Increment counter
      await db
        .update(emailCampaigns)
        .set({ totalClicked: sql`totalClicked + 1` })
        .where(eq(emailCampaigns.id, input.campaignId));

      return { success: true };
    }),
});
