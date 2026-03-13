import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { crmContacts, crmInteractions, crmNotes, users, eventTickets, coursePurchases, classPurchases, emailOpens, emailClicks, orders } from "../../drizzle/schema";
import { eq, like, and, or, count, sql, desc } from "drizzle-orm";
import { sendEmail } from "./email";

export const crmRouter = router({
  // ===== USERS =====
  listUsers: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Build WHERE conditions
        const whereConditions = input.search
          ? or(
              like(users.email, `%${input.search}%`),
              like(users.name, `%${input.search}%`)
            )
          : undefined;

        // ✅ FIX N+1: Single query with LEFT JOINs and GROUP BY
        // This replaces 3N queries (N users × 3 counts each) with 1 query
        const enrichedUsers = await db
          .select({
            id: users.id,
            openId: users.openId,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
            bio: users.bio,
            role: users.role,
            roles: users.roles,
            subscriptionPlan: users.subscriptionPlan,
            stripeCustomerId: users.stripeCustomerId,
            stripeAccountId: users.stripeAccountId,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            lastSignedIn: users.lastSignedIn,
            ticketsPurchased: sql<number>`CAST(COUNT(DISTINCT ${eventTickets.id}) AS INTEGER)`,
            coursesPurchased: sql<number>`CAST(COUNT(DISTINCT ${coursePurchases.id}) AS INTEGER)`,
            classesPurchased: sql<number>`CAST(COUNT(DISTINCT ${classPurchases.id}) AS INTEGER)`,
            totalPurchases: sql<number>`CAST(
              COUNT(DISTINCT ${eventTickets.id}) +
              COUNT(DISTINCT ${coursePurchases.id}) +
              COUNT(DISTINCT ${classPurchases.id})
            AS INTEGER)`,
          })
          .from(users)
          .leftJoin(eventTickets, eq(eventTickets.userId, users.id))
          .leftJoin(coursePurchases, eq(coursePurchases.userId, users.id))
          .leftJoin(classPurchases, eq(classPurchases.userId, users.id))
          .where(whereConditions)
          .groupBy(users.id)
          .orderBy(desc(users.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return enrichedUsers;
      } catch (error) {
        console.error("Error listing users:", error);
        throw new Error("Failed to list users");
      }
    }),

  // ===== CONTACTS =====
  listContacts: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      search: z.string().optional(),
      segment: z.enum(["lead", "customer", "vip", "inactive"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];

      if (input.search) {
        conditions.push(like(crmContacts.email, `%${input.search}%`));
      }

      if (input.segment) {
        conditions.push(eq(crmContacts.segment, input.segment));
      }

      if (conditions.length > 0) {
        const results = await db
          .select()
          .from(crmContacts)
          .where(and(...conditions))
          .limit(input.limit)
          .offset(input.offset);
        return results;
      } else {
        const results = await db
          .select()
          .from(crmContacts)
          .limit(input.limit)
          .offset(input.offset);
        return results;
      }
    }),

  getContact: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const contact = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.id, input.id))
        .limit(1);

      return contact[0] || null;
    }),

  createContact: adminProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
      segment: z.enum(["lead", "customer", "vip", "inactive"]).default("lead"),
      source: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check for duplicate email
      const existing = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(`Contact with email ${input.email} already exists`);
      }

      const result = await db.insert(crmContacts).values({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        address: input.address,
        city: input.city,
        country: input.country,
        postalCode: input.postalCode,
        segment: input.segment,
        source: input.source,
        notes: input.notes,
      });

      return result;
    }),

  updateContact: adminProcedure
    .input(z.object({
      id: z.number(),
      email: z.string().email().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
      segment: z.enum(["lead", "customer", "vip", "inactive"]).optional(),
      status: z.enum(["active", "inactive", "unsubscribed"]).optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      const result = await db
        .update(crmContacts)
        .set(updateData)
        .where(eq(crmContacts.id, id));

      return result;
    }),

  deleteContact: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .delete(crmContacts)
        .where(eq(crmContacts.id, input.id));

      return result;
    }),

  // ===== INTERACTIONS =====
  listInteractions: adminProcedure
    .input(z.object({
      contactId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select()
        .from(crmInteractions)
        .where(eq(crmInteractions.contactId, input.contactId))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  createInteraction: adminProcedure
    .input(z.object({
      contactId: z.number(),
      type: z.enum(["email", "call", "message", "meeting", "note"]),
      subject: z.string().optional(),
      content: z.string(),
      status: z.enum(["pending", "completed", "follow_up"]).default("completed"),
      scheduledDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(crmInteractions).values({
        contactId: input.contactId,
        type: input.type,
        subject: input.subject,
        content: input.content,
        status: input.status,
        scheduledDate: input.scheduledDate,
        completedDate: input.status === "completed" ? new Date() : null,
      });

      return result;
    }),

  // ===== NOTES =====
  listNotes: adminProcedure
    .input(z.object({
      contactId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select()
        .from(crmNotes)
        .where(eq(crmNotes.contactId, input.contactId))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  createNote: adminProcedure
    .input(z.object({
      contactId: z.number(),
      content: z.string(),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(crmNotes).values({
        contactId: input.contactId,
        content: input.content,
        priority: input.priority,
      });

      return result;
    }),

  deleteNote: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .delete(crmNotes)
        .where(eq(crmNotes.id, input.id));

      return result;
    }),

  // ===== CSV EXPORT =====
  exportContactsCSV: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const contacts = await db.select().from(crmContacts);

    // RFC 4180-compliant cell quoting: always quote to be safe
    const quoteCell = (val: string | number | null | undefined): string => {
      const str = val == null ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Email", "First Name", "Last Name", "Phone",
      "Address", "City", "Country", "Postal Code",
      "Segment", "Status", "Source", "Notes",
    ];

    const rows = contacts.map((c) => [
      c.email,
      c.firstName || "",
      c.lastName || "",
      c.phone || "",
      c.address || "",
      c.city || "",
      c.country || "",
      c.postalCode || "",
      c.segment || "lead",
      c.status || "active",
      c.source || "",
      c.notes || "",
    ]);

    const csv = [
      headers.map(quoteCell).join(","),
      ...rows.map((row) => row.map(quoteCell).join(",")),
    ].join("\r\n");

    return { csv, filename: `contacts-${new Date().toISOString().split("T")[0]}.csv` };
  }),

  // ===== CSV TEMPLATE =====
  getCSVTemplate: adminProcedure.query(() => {
    const headers = [
      "Email", "First Name", "Last Name", "Phone",
      "Address", "City", "Country", "Postal Code",
      "Segment", "Source", "Notes",
    ];
    const example = [
      "jane@example.com", "Jane", "Smith", "+44 7700 900000",
      "123 High Street", "London", "UK", "SW1A 1AA",
      "lead", "instagram", "Met at salsa night",
    ];
    const quoteCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      headers.map(quoteCell).join(","),
      example.map(quoteCell).join(","),
    ].join("\r\n");
    return { csv, filename: "contacts-import-template.csv" };
  }),

  // ===== CSV IMPORT =====
  importContactsCSV: adminProcedure
    .input(z.object({ csvData: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // ── RFC 4180-compliant CSV parser ──────────────────────────────────────
      function parseCSV(text: string): string[][] {
        const rows: string[][] = [];
        let row: string[] = [];
        let cell = "";
        let inQuotes = false;
        // Normalise line endings
        const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if (inQuotes) {
            if (ch === '"') {
              if (s[i + 1] === '"') { cell += '"'; i++; } // escaped quote
              else { inQuotes = false; }                   // closing quote
            } else {
              cell += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === ",") {
              row.push(cell); cell = "";
            } else if (ch === "\n") {
              row.push(cell); cell = "";
              if (row.some((c) => c !== "")) rows.push(row);
              row = [];
            } else {
              cell += ch;
            }
          }
        }
        // Last cell / row
        row.push(cell);
        if (row.some((c) => c !== "")) rows.push(row);
        return rows;
      }
      // ──────────────────────────────────────────────────────────────────────

      const rows = parseCSV(input.csvData.trim());
      if (rows.length < 2) throw new Error("CSV must have at least a header row and one data row");

      // Normalise headers: lowercase, strip whitespace
      const rawHeaders = rows[0].map((h) => h.trim().toLowerCase());

      // Map common header aliases → canonical field names
      const ALIASES: Record<string, string> = {
        "email": "email",
        "e-mail": "email",
        "first name": "firstName",
        "firstname": "firstName",
        "first_name": "firstName",
        "last name": "lastName",
        "lastname": "lastName",
        "last_name": "lastName",
        "phone": "phone",
        "mobile": "phone",
        "telephone": "phone",
        "address": "address",
        "city": "city",
        "town": "city",
        "country": "country",
        "postal code": "postalCode",
        "postalcode": "postalCode",
        "postal_code": "postalCode",
        "postcode": "postalCode",
        "zip": "postalCode",
        "segment": "segment",
        "status": "status",
        "source": "source",
        "notes": "notes",
        "note": "notes",
      };
      const headers = rawHeaders.map((h) => ALIASES[h] ?? h);

      const emailIdx = headers.indexOf("email");
      if (emailIdx === -1) throw new Error("CSV must contain an 'Email' column");

      const VALID_SEGMENTS = new Set(["lead", "customer", "vip", "inactive"]);
      const VALID_STATUSES  = new Set(["active", "unsubscribed", "bounced"]);

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        const rowNum = i + 1;
        try {
          const get = (field: string) => {
            const idx = headers.indexOf(field);
            return idx !== -1 ? (values[idx] ?? "").trim() : "";
          };

          const email = get("email").toLowerCase();
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Row ${rowNum}: Invalid or missing email — skipped`);
            skippedCount++;
            continue;
          }

          // Duplicate check
          const existing = await db
            .select({ id: crmContacts.id })
            .from(crmContacts)
            .where(eq(crmContacts.email, email))
            .limit(1);

          if (existing.length > 0) {
            errors.push(`Row ${rowNum}: ${email} already exists — skipped`);
            skippedCount++;
            continue;
          }

          const rawSegment = get("segment").toLowerCase();
          const segment = VALID_SEGMENTS.has(rawSegment) ? rawSegment as any : "lead";

          const rawStatus = get("status").toLowerCase();
          const status = VALID_STATUSES.has(rawStatus) ? rawStatus as any : "active";

          await db.insert(crmContacts).values({
            email,
            firstName:  get("firstName")  || undefined,
            lastName:   get("lastName")   || undefined,
            phone:      get("phone")      || undefined,
            address:    get("address")    || undefined,
            city:       get("city")       || undefined,
            country:    get("country")    || undefined,
            postalCode: get("postalCode") || undefined,
            segment,
            status,
            source:     get("source")     || undefined,
            notes:      get("notes")      || undefined,
          });

          importedCount++;
        } catch (error) {
          errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`);
          skippedCount++;
        }
      }

      return { imported: importedCount, skipped: skippedCount, errors };
    }),

  // ===== BULK EMAIL =====
  sendBulkEmail: adminProcedure
    .input(z.object({
      subject: z.string(),
      htmlContent: z.string(),
      segment: z.enum(["lead", "customer", "vip", "inactive"]).optional(),
      status: z.enum(["active", "inactive", "unsubscribed"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];

      if (input.segment) {
        conditions.push(eq(crmContacts.segment, input.segment));
      }

      if (input.status) {
        conditions.push(eq(crmContacts.status, input.status));
      }

      // Get all matching contacts
      let contacts;
      if (conditions.length > 0) {
        contacts = await db
          .select()
          .from(crmContacts)
          .where(and(...conditions));
      } else {
        contacts = await db.select().from(crmContacts);
      }

      let sent = 0;
      const errors: string[] = [];

      for (const contact of contacts) {
        try {
          await sendEmail({
            to: contact.email,
            subject: input.subject,
            htmlContent: input.htmlContent,
          });
          sent++;
        } catch (error) {
          errors.push(`${contact.email}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      return { sent, total: contacts.length, errors };
    }),

  // ===== STATISTICS =====
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const totalContacts = await db.select().from(crmContacts);
    const leads = totalContacts.filter((c) => c.segment === "lead").length;
    const customers = totalContacts.filter((c) => c.segment === "customer").length;
    const vips = totalContacts.filter((c) => c.segment === "vip").length;

    return {
      totalContacts: totalContacts.length,
      leads,
      customers,
      vips,
      activeContacts: totalContacts.filter((c) => c.status === "active").length,
    };
  }),

  // ===== ENGAGEMENT SCORING =====

  /**
   * Compute and persist the engagement score for a single contact.
   * Scoring model (max 100):
   *   Opens:     +2 pts each, capped at 20  (10 opens = max)
   *   Clicks:    +5 pts each, capped at 30  (6 clicks = max)
   *   Purchases: +15 pts each, capped at 45 (3 purchases = max)
   *   Recency:   +5 pts if any activity in last 30 days
   */
  computeContactScore: adminProcedure
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { score, tier, breakdown } = await computeEngagementScore(db, input.contactId);

      await db
        .update(crmContacts)
        .set({ engagementScore: score, engagementTier: tier, scoreUpdatedAt: new Date() })
        .where(eq(crmContacts.id, input.contactId));

      return { score, tier, breakdown };
    }),

  /**
   * Refresh engagement scores for ALL active contacts.
   * Called manually from the CRM dashboard or on a schedule.
   */
  refreshAllScores: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const contacts = await db
      .select({ id: crmContacts.id })
      .from(crmContacts)
      .where(eq(crmContacts.status, "active"));

    let updated = 0;
    for (const contact of contacts) {
      try {
        const { score, tier } = await computeEngagementScore(db, contact.id);
        await db
          .update(crmContacts)
          .set({ engagementScore: score, engagementTier: tier, scoreUpdatedAt: new Date() })
          .where(eq(crmContacts.id, contact.id));
        updated++;
      } catch {
        // skip individual failures
      }
    }

    return { updated, total: contacts.length };
  }),

  /**
   * Get the engagement score breakdown for a single contact.
   */
  getContactEngagement: adminProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [contact] = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.id, input.contactId))
        .limit(1);

      if (!contact) throw new Error("Contact not found");

      const { score, tier, breakdown } = await computeEngagementScore(db, input.contactId);

      return { contact, score, tier, breakdown };
    }),
});

// ─── Scoring engine ───────────────────────────────────────────────────────────

type Tier = "cold" | "warm" | "hot" | "champion";

function scoreToTier(score: number): Tier {
  if (score >= 75) return "champion";
  if (score >= 50) return "hot";
  if (score >= 25) return "warm";
  return "cold";
}

async function computeEngagementScore(
  db: Awaited<ReturnType<typeof getDb>>,
  contactId: number
): Promise<{ score: number; tier: Tier; breakdown: Record<string, number> }> {
  if (!db) return { score: 0, tier: "cold", breakdown: {} };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Count email opens
  const [openRow] = await db
    .select({ total: count() })
    .from(emailOpens)
    .where(eq(emailOpens.contactId, contactId));
  const totalOpens = openRow?.total ?? 0;

  // Count email clicks
  const [clickRow] = await db
    .select({ total: count() })
    .from(emailClicks)
    .where(eq(emailClicks.contactId, contactId));
  const totalClicks = clickRow?.total ?? 0;

  // Count completed purchases (orders by email match via crmContacts)
  // We join crmContacts → users (by email) → orders
  const [contact] = await db
    .select({ email: crmContacts.email })
    .from(crmContacts)
    .where(eq(crmContacts.id, contactId))
    .limit(1);

  let totalPurchases = 0;
  let hasRecentActivity = false;

  if (contact) {
    // Find user by email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, contact.email))
      .limit(1);

    if (user) {
      const [purchaseRow] = await db
        .select({ total: count() })
        .from(orders)
        .where(and(eq(orders.userId, user.id), eq(orders.status, "completed")));
      totalPurchases = purchaseRow?.total ?? 0;

      // Check recency: any purchase in last 30 days
      const recentOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.userId, user.id),
            eq(orders.status, "completed"),
            sql`${orders.createdAt} >= ${thirtyDaysAgo}`
          )
        )
        .limit(1);
      hasRecentActivity = recentOrders.length > 0;
    }
  }

  // Also check recency from email opens
  if (!hasRecentActivity) {
    const recentOpens = await db
      .select({ id: emailOpens.id })
      .from(emailOpens)
      .where(
        and(
          eq(emailOpens.contactId, contactId),
          sql`${emailOpens.openedAt} >= ${thirtyDaysAgo}`
        )
      )
      .limit(1);
    hasRecentActivity = recentOpens.length > 0;
  }

  // Calculate score components
  const openScore = Math.min(totalOpens * 2, 20);
  const clickScore = Math.min(totalClicks * 5, 30);
  const purchaseScore = Math.min(totalPurchases * 15, 45);
  const recencyBonus = hasRecentActivity ? 5 : 0;

  const score = openScore + clickScore + purchaseScore + recencyBonus;
  const tier = scoreToTier(score);

  return {
    score,
    tier,
    breakdown: {
      opens: totalOpens,
      openScore,
      clicks: totalClicks,
      clickScore,
      purchases: totalPurchases,
      purchaseScore,
      recencyBonus,
      total: score,
    },
  };
}
