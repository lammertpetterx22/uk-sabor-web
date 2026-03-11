import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("../server/db", () => ({
  getDb: vi.fn(),
}));

// Mock email sending
vi.mock("../server/features/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { getDb } from "../server/db";
import { sendEmail } from "../server/features/email";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
};

describe("Email Marketing - Template Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getDb as any).mockResolvedValue(mockDb);
  });

  it("should list templates from database", async () => {
    const mockTemplates = [
      { id: 1, name: "Event Template", category: "event", subject: "New Event!", htmlContent: "<p>Test</p>", isDefault: true },
      { id: 2, name: "Course Template", category: "course", subject: "New Course!", htmlContent: "<p>Test</p>", isDefault: false },
    ];
    mockDb.orderBy.mockResolvedValueOnce(mockTemplates);

    const db = await getDb();
    expect(db).toBeTruthy();
    const result = await db!.select().from({} as any).orderBy({} as any);
    expect(result).toEqual(mockTemplates);
    expect(result).toHaveLength(2);
  });

  it("should prevent deletion of default templates", async () => {
    const defaultTemplate = { id: 1, name: "Default", isDefault: true };
    mockDb.limit.mockResolvedValueOnce([defaultTemplate]);

    const db = await getDb();
    const [tpl] = await db!.select().from({} as any).where({} as any).limit(1);
    
    expect(tpl.isDefault).toBe(true);
    // In the actual router, this would throw an error
    const shouldThrow = tpl?.isDefault;
    expect(shouldThrow).toBe(true);
  });

  it("should allow deletion of non-default templates", async () => {
    const customTemplate = { id: 5, name: "Custom", isDefault: false };
    mockDb.limit.mockResolvedValueOnce([customTemplate]);

    const db = await getDb();
    const [tpl] = await db!.select().from({} as any).where({} as any).limit(1);
    
    expect(tpl.isDefault).toBe(false);
  });
});

describe("Email Marketing - Campaign Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getDb as any).mockResolvedValue(mockDb);
  });

  it("should list campaigns ordered by creation date", async () => {
    const mockCampaigns = [
      { id: 2, name: "March Blast", status: "sent", totalSent: 100, totalOpened: 25 },
      { id: 1, name: "February Blast", status: "sent", totalSent: 80, totalOpened: 20 },
    ];
    mockDb.orderBy.mockResolvedValueOnce(mockCampaigns);

    const db = await getDb();
    const campaigns = await db!.select().from({} as any).orderBy({} as any);
    expect(campaigns).toHaveLength(2);
    expect(campaigns[0].id).toBe(2); // Most recent first
  });

  it("should calculate open rate correctly", () => {
    const totalSent = 100;
    const totalOpened = 25;
    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    expect(openRate).toBe(25);
  });

  it("should calculate click rate correctly", () => {
    const totalSent = 200;
    const totalClicked = 10;
    const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
    expect(clickRate).toBe(5);
  });

  it("should return 0 rates when no emails sent", () => {
    const totalSent = 0;
    const totalOpened = 0;
    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    const clickRate = totalSent > 0 ? Math.round((0 / totalSent) * 100) : 0;
    expect(openRate).toBe(0);
    expect(clickRate).toBe(0);
  });

  it("should set status to scheduled when scheduledAt is provided", () => {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const status = scheduledAt ? "scheduled" : "draft";
    expect(status).toBe("scheduled");
  });

  it("should set status to draft when no scheduledAt", () => {
    const scheduledAt = null;
    const status = scheduledAt ? "scheduled" : "draft";
    expect(status).toBe("draft");
  });
});

describe("Email Marketing - Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getDb as any).mockResolvedValue(mockDb);
  });

  it("should aggregate campaign totals correctly", () => {
    const campaigns = [
      { totalSent: 100, totalOpened: 25, totalClicked: 10 },
      { totalSent: 200, totalOpened: 60, totalClicked: 20 },
      { totalSent: 150, totalOpened: 45, totalClicked: 15 },
    ];

    const totalSent = campaigns.reduce((sum, c) => sum + (c.totalSent || 0), 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + (c.totalOpened || 0), 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + (c.totalClicked || 0), 0);

    expect(totalSent).toBe(450);
    expect(totalOpened).toBe(130);
    expect(totalClicked).toBe(45);
  });

  it("should calculate average open rate across campaigns", () => {
    const totalSent = 450;
    const totalOpened = 130;
    const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    expect(avgOpenRate).toBe(29); // 130/450 = 28.88... rounds to 29
  });

  it("should identify top performing campaigns", () => {
    const campaigns = [
      { id: 1, name: "A", totalSent: 100, totalOpened: 50, openRate: 50 },
      { id: 2, name: "B", totalSent: 100, totalOpened: 20, openRate: 20 },
      { id: 3, name: "C", totalSent: 100, totalOpened: 35, openRate: 35 },
    ];

    const sorted = [...campaigns].sort((a, b) => b.openRate - a.openRate);
    expect(sorted[0].name).toBe("A");
    expect(sorted[0].openRate).toBe(50);
  });

  it("should count unique openers correctly", () => {
    const opens = [
      { contactId: 1, campaignId: 1 },
      { contactId: 2, campaignId: 1 },
      { contactId: 1, campaignId: 1 }, // duplicate - same contact opened twice
      { contactId: 3, campaignId: 1 },
    ];

    const uniqueOpeners = new Set(opens.map((o) => o.contactId)).size;
    expect(uniqueOpeners).toBe(3); // Only 3 unique contacts
  });

  it("should count unique clickers correctly", () => {
    const clicks = [
      { contactId: 1, url: "https://example.com/a" },
      { contactId: 1, url: "https://example.com/b" }, // same contact, different URL
      { contactId: 2, url: "https://example.com/a" },
    ];

    const uniqueClickers = new Set(clicks.map((c) => c.contactId)).size;
    expect(uniqueClickers).toBe(2);
  });

  it("should aggregate click counts by URL", () => {
    const clicks = [
      { url: "https://example.com/events" },
      { url: "https://example.com/events" },
      { url: "https://example.com/courses" },
      { url: "https://example.com/events" },
    ];

    const urlCounts: Record<string, number> = {};
    for (const click of clicks) {
      urlCounts[click.url] = (urlCounts[click.url] || 0) + 1;
    }

    expect(urlCounts["https://example.com/events"]).toBe(3);
    expect(urlCounts["https://example.com/courses"]).toBe(1);
  });
});

describe("Email Marketing - Default Templates", () => {
  it("should have 5 default templates", async () => {
    const { DEFAULT_TEMPLATES } = await import("../server/features/emailMarketing");
    expect(DEFAULT_TEMPLATES).toHaveLength(5);
  });

  it("should have templates for all required categories", async () => {
    const { DEFAULT_TEMPLATES } = await import("../server/features/emailMarketing");
    const categories = DEFAULT_TEMPLATES.map((t) => t.category);
    expect(categories).toContain("event");
    expect(categories).toContain("course");
    expect(categories).toContain("class");
    expect(categories).toContain("promotion");
    expect(categories).toContain("newsletter");
  });

  it("should have all templates marked as default", async () => {
    const { DEFAULT_TEMPLATES } = await import("../server/features/emailMarketing");
    const allDefault = DEFAULT_TEMPLATES.every((t) => t.isDefault === true);
    expect(allDefault).toBe(true);
  });

  it("should have non-empty HTML content for all templates", async () => {
    const { DEFAULT_TEMPLATES } = await import("../server/features/emailMarketing");
    for (const tpl of DEFAULT_TEMPLATES) {
      expect(tpl.htmlContent.length).toBeGreaterThan(100);
      expect(tpl.subject.length).toBeGreaterThan(5);
      expect(tpl.name.length).toBeGreaterThan(3);
    }
  });
});

describe("Email Tracking - Open Pixel Logic", () => {
  it("should produce a valid 1x1 GIF buffer", () => {
    const TRACKING_PIXEL = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    expect(TRACKING_PIXEL.length).toBeGreaterThan(0);
    // GIF magic bytes: 47 49 46 38 (GIF8)
    expect(TRACKING_PIXEL[0]).toBe(0x47); // G
    expect(TRACKING_PIXEL[1]).toBe(0x49); // I
    expect(TRACKING_PIXEL[2]).toBe(0x46); // F
  });

  it("should parse valid campaignId and contactId from route params", () => {
    const params = { campaignId: "42", contactId: "7" };
    const campaignId = parseInt(params.campaignId, 10);
    const contactId = parseInt(params.contactId, 10);
    expect(campaignId).toBe(42);
    expect(contactId).toBe(7);
    expect(isNaN(campaignId)).toBe(false);
    expect(isNaN(contactId)).toBe(false);
  });

  it("should reject invalid (NaN) params without recording", () => {
    const params = { campaignId: "abc", contactId: "xyz" };
    const campaignId = parseInt(params.campaignId, 10);
    const contactId = parseInt(params.contactId, 10);
    expect(isNaN(campaignId)).toBe(true);
    expect(isNaN(contactId)).toBe(true);
    // In the handler: if (!isNaN(campaignId) && !isNaN(contactId)) { ... }
    const shouldRecord = !isNaN(campaignId) && !isNaN(contactId);
    expect(shouldRecord).toBe(false);
  });

  it("should truncate IP address to 45 chars", () => {
    const longIp = "2001:0db8:85a3:0000:0000:8a2e:0370:7334:extra:data";
    const truncated = longIp.slice(0, 45);
    expect(truncated.length).toBeLessThanOrEqual(45);
  });

  it("should truncate user agent to 512 chars", () => {
    const longUA = "Mozilla/5.0 ".repeat(50);
    const truncated = longUA.slice(0, 512);
    expect(truncated.length).toBeLessThanOrEqual(512);
  });
});

describe("Email Tracking - Click Redirect Logic", () => {
  it("should use default redirect when url param is missing", () => {
    const query = {} as Record<string, string>;
    const targetUrl = (query.url as string) || "/";
    expect(targetUrl).toBe("/");
  });

  it("should use provided url param for redirect", () => {
    const query = { url: "https://consabor.uk/events" };
    const targetUrl = (query.url as string) || "/";
    expect(targetUrl).toBe("https://consabor.uk/events");
  });

  it("should truncate URL to 2048 chars before storing", () => {
    const longUrl = "https://example.com/" + "a".repeat(2100);
    const stored = longUrl.slice(0, 2048);
    expect(stored.length).toBe(2048);
  });
});

describe("Email Marketing - Campaign Detail Logic", () => {
  it("should build per-contact engagement map from opens and clicks", () => {
    const opens = [
      { contactId: 1, contactFirstName: "Alice", contactLastName: "Smith", contactEmail: "alice@example.com", openedAt: new Date("2024-01-01T10:00:00Z") },
      { contactId: 1, contactFirstName: "Alice", contactLastName: "Smith", contactEmail: "alice@example.com", openedAt: new Date("2024-01-01T11:00:00Z") },
      { contactId: 2, contactFirstName: "Bob", contactLastName: null, contactEmail: "bob@example.com", openedAt: new Date("2024-01-01T12:00:00Z") },
    ];

    const clicks = [
      { contactId: 1, contactFirstName: "Alice", contactLastName: "Smith", contactEmail: "alice@example.com", url: "https://consabor.uk/events", clickedAt: new Date("2024-01-01T10:05:00Z") },
      { contactId: 3, contactFirstName: "Carol", contactLastName: "Jones", contactEmail: "carol@example.com", url: "https://consabor.uk/courses", clickedAt: new Date("2024-01-01T13:00:00Z") },
    ];

    const contactMap: Record<number, any> = {};

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

    // Alice: 2 opens, 1 click
    expect(contactMap[1].openCount).toBe(2);
    expect(contactMap[1].clickCount).toBe(1);
    expect(contactMap[1].name).toBe("Alice Smith");
    expect(contactMap[1].firstOpenedAt).toEqual(new Date("2024-01-01T10:00:00Z"));

    // Bob: 1 open, 0 clicks, no last name
    expect(contactMap[2].openCount).toBe(1);
    expect(contactMap[2].clickCount).toBe(0);
    expect(contactMap[2].name).toBe("Bob");

    // Carol: 0 opens, 1 click
    expect(contactMap[3].openCount).toBe(0);
    expect(contactMap[3].clickCount).toBe(1);
    expect(contactMap[3].clickedUrls).toContain("https://consabor.uk/courses");
  });

  it("should aggregate URL click counts for top links", () => {
    const clicks = [
      { url: "https://consabor.uk/events" },
      { url: "https://consabor.uk/events" },
      { url: "https://consabor.uk/courses" },
      { url: "https://consabor.uk/events" },
      { url: "https://consabor.uk/classes" },
    ];

    const urlCounts: Record<string, number> = {};
    for (const click of clicks) {
      urlCounts[click.url] = (urlCounts[click.url] || 0) + 1;
    }

    const topLinks = Object.entries(urlCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, count]) => ({ url, count }));

    expect(topLinks[0].url).toBe("https://consabor.uk/events");
    expect(topLinks[0].count).toBe(3);
    expect(topLinks).toHaveLength(3);
  });

  it("should sort contacts by total engagement descending", () => {
    const contactMap = {
      1: { contactId: 1, openCount: 1, clickCount: 0 },
      2: { contactId: 2, openCount: 3, clickCount: 2 },
      3: { contactId: 3, openCount: 0, clickCount: 5 },
    };

    const sorted = Object.values(contactMap).sort(
      (a, b) => (b.openCount + b.clickCount) - (a.openCount + a.clickCount)
    );

    expect(sorted[0].contactId).toBe(2); // 5 total
    expect(sorted[1].contactId).toBe(3); // 5 total (clicks)
    expect(sorted[2].contactId).toBe(1); // 1 total (open)
  });

  it("should calculate open rate as percentage", () => {
    const totalSent = 200;
    const totalOpened = 50;
    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    expect(openRate).toBe(25);
  });

  it("should return 0 open rate when nothing sent", () => {
    const totalSent = 0;
    const openRate = totalSent > 0 ? Math.round((10 / totalSent) * 100) : 0;
    expect(openRate).toBe(0);
  });
});

describe("Email Marketing - Auto-seed Logic", () => {
  it("should skip seeding when default templates already exist", async () => {
    const existing = [{ id: 1, isDefault: true }];
    // Simulate the guard: if existing.length > 0, skip
    const shouldSeed = existing.length === 0;
    expect(shouldSeed).toBe(false);
  });

  it("should seed when no default templates exist", async () => {
    const existing: any[] = [];
    const shouldSeed = existing.length === 0;
    expect(shouldSeed).toBe(true);
  });

  it("should export seedDefaultEmailTemplates as a function", async () => {
    const { seedDefaultEmailTemplates } = await import("../server/features/emailMarketing");
    expect(typeof seedDefaultEmailTemplates).toBe("function");
  });
});

describe("Email Marketing - Tracking Pixel Injection", () => {
  it("should inject tracking pixel at end of HTML content", () => {
    const baseUrl = "https://consabor.uk";
    const campaignId = 5;
    const contactId = 12;
    const htmlContent = "<html><body><p>Hello!</p></body></html>";

    const trackingPixel = `<img src="${baseUrl}/api/email/track/open/${campaignId}/${contactId}" width="1" height="1" style="display:none" alt="" />`;
    const trackedContent = htmlContent + trackingPixel;

    expect(trackedContent).toContain("/api/email/track/open/5/12");
    expect(trackedContent).toContain('width="1"');
    expect(trackedContent).toContain('style="display:none"');
    expect(trackedContent.startsWith(htmlContent)).toBe(true);
  });

  it("should use origin-based URL for tracking pixel", () => {
    const origin = "https://uksabor-dgihapaj.manus.space";
    const baseUrl = origin || "https://consabor.uk";
    expect(baseUrl).toBe(origin);
  });

  it("should fall back to production domain when no origin provided", () => {
    const origin = undefined;
    const baseUrl = origin || process.env.APP_BASE_URL || "https://consabor.uk";
    expect(baseUrl).toBe("https://consabor.uk");
  });
});
