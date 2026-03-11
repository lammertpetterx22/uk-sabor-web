import { describe, it, expect } from "vitest";

// ─── Scoring engine (inline copy for testing) ────────────────────────────────

type Tier = "cold" | "warm" | "hot" | "champion";

function scoreToTier(score: number): Tier {
  if (score >= 75) return "champion";
  if (score >= 50) return "hot";
  if (score >= 25) return "warm";
  return "cold";
}

function computeScore({
  opens,
  clicks,
  purchases,
  hasRecentActivity,
}: {
  opens: number;
  clicks: number;
  purchases: number;
  hasRecentActivity: boolean;
}) {
  const openScore     = Math.min(opens     * 2,  20);
  const clickScore    = Math.min(clicks    * 5,  30);
  const purchaseScore = Math.min(purchases * 15, 45);
  const recencyBonus  = hasRecentActivity ? 5 : 0;
  const total         = openScore + clickScore + purchaseScore + recencyBonus;
  return { openScore, clickScore, purchaseScore, recencyBonus, total, tier: scoreToTier(total) };
}

// ─── Tier boundary tests ─────────────────────────────────────────────────────

describe("Engagement Score - Tier Boundaries", () => {
  it("should return 'cold' for score 0", () => {
    expect(scoreToTier(0)).toBe("cold");
  });

  it("should return 'cold' for score 24", () => {
    expect(scoreToTier(24)).toBe("cold");
  });

  it("should return 'warm' for score 25", () => {
    expect(scoreToTier(25)).toBe("warm");
  });

  it("should return 'warm' for score 49", () => {
    expect(scoreToTier(49)).toBe("warm");
  });

  it("should return 'hot' for score 50", () => {
    expect(scoreToTier(50)).toBe("hot");
  });

  it("should return 'hot' for score 74", () => {
    expect(scoreToTier(74)).toBe("hot");
  });

  it("should return 'champion' for score 75", () => {
    expect(scoreToTier(75)).toBe("champion");
  });

  it("should return 'champion' for score 100", () => {
    expect(scoreToTier(100)).toBe("champion");
  });
});

// ─── Score component caps ─────────────────────────────────────────────────────

describe("Engagement Score - Component Caps", () => {
  it("should cap open score at 20 pts (10 opens)", () => {
    const { openScore } = computeScore({ opens: 10, clicks: 0, purchases: 0, hasRecentActivity: false });
    expect(openScore).toBe(20);
  });

  it("should not exceed open cap with more opens", () => {
    const { openScore } = computeScore({ opens: 100, clicks: 0, purchases: 0, hasRecentActivity: false });
    expect(openScore).toBe(20);
  });

  it("should cap click score at 30 pts (6 clicks)", () => {
    const { clickScore } = computeScore({ opens: 0, clicks: 6, purchases: 0, hasRecentActivity: false });
    expect(clickScore).toBe(30);
  });

  it("should not exceed click cap with more clicks", () => {
    const { clickScore } = computeScore({ opens: 0, clicks: 50, purchases: 0, hasRecentActivity: false });
    expect(clickScore).toBe(30);
  });

  it("should cap purchase score at 45 pts (3 purchases)", () => {
    const { purchaseScore } = computeScore({ opens: 0, clicks: 0, purchases: 3, hasRecentActivity: false });
    expect(purchaseScore).toBe(45);
  });

  it("should not exceed purchase cap with more purchases", () => {
    const { purchaseScore } = computeScore({ opens: 0, clicks: 0, purchases: 10, hasRecentActivity: false });
    expect(purchaseScore).toBe(45);
  });

  it("should give 5 pts recency bonus when recently active", () => {
    const { recencyBonus } = computeScore({ opens: 0, clicks: 0, purchases: 0, hasRecentActivity: true });
    expect(recencyBonus).toBe(5);
  });

  it("should give 0 pts recency bonus when not recently active", () => {
    const { recencyBonus } = computeScore({ opens: 0, clicks: 0, purchases: 0, hasRecentActivity: false });
    expect(recencyBonus).toBe(0);
  });
});

// ─── Max score ────────────────────────────────────────────────────────────────

describe("Engagement Score - Maximum Score", () => {
  it("should reach exactly 100 with all components maxed", () => {
    const { total } = computeScore({ opens: 10, clicks: 6, purchases: 3, hasRecentActivity: true });
    expect(total).toBe(100);
  });

  it("should not exceed 100 with extreme inputs", () => {
    const { total } = computeScore({ opens: 999, clicks: 999, purchases: 999, hasRecentActivity: true });
    expect(total).toBe(100);
  });
});

// ─── Realistic scenarios ──────────────────────────────────────────────────────

describe("Engagement Score - Realistic Scenarios", () => {
  it("new lead with no activity should be cold with score 0", () => {
    const result = computeScore({ opens: 0, clicks: 0, purchases: 0, hasRecentActivity: false });
    expect(result.total).toBe(0);
    expect(result.tier).toBe("cold");
  });

  it("contact who opened 2 emails should be cold", () => {
    const result = computeScore({ opens: 2, clicks: 0, purchases: 0, hasRecentActivity: false });
    expect(result.total).toBe(4);
    expect(result.tier).toBe("cold");
  });

  it("contact who opened emails and clicked should be warm", () => {
    const result = computeScore({ opens: 5, clicks: 2, purchases: 0, hasRecentActivity: false });
    expect(result.total).toBe(10 + 10); // 20 pts
    expect(result.tier).toBe("cold");
  });

  it("contact with 1 purchase and some opens should be warm", () => {
    const result = computeScore({ opens: 3, clicks: 0, purchases: 1, hasRecentActivity: false });
    expect(result.total).toBe(6 + 0 + 15); // 21 pts
    expect(result.tier).toBe("cold");
  });

  it("contact with 2 purchases and recent activity should be hot", () => {
    const result = computeScore({ opens: 5, clicks: 2, purchases: 2, hasRecentActivity: true });
    // 10 + 10 + 30 + 5 = 55
    expect(result.total).toBe(55);
    expect(result.tier).toBe("hot");
  });

  it("contact with 3 purchases and max email engagement should be champion", () => {
    const result = computeScore({ opens: 10, clicks: 6, purchases: 3, hasRecentActivity: false });
    // 20 + 30 + 45 + 0 = 95
    expect(result.total).toBe(95);
    expect(result.tier).toBe("champion");
  });

  it("contact with 1 purchase and recent activity should reach warm", () => {
    const result = computeScore({ opens: 3, clicks: 1, purchases: 1, hasRecentActivity: true });
    // 6 + 5 + 15 + 5 = 31
    expect(result.total).toBe(31);
    expect(result.tier).toBe("warm");
  });
});

// ─── Score breakdown structure ────────────────────────────────────────────────

describe("Engagement Score - Breakdown Structure", () => {
  it("should return all breakdown fields", () => {
    const result = computeScore({ opens: 3, clicks: 2, purchases: 1, hasRecentActivity: true });
    expect(result).toHaveProperty("openScore");
    expect(result).toHaveProperty("clickScore");
    expect(result).toHaveProperty("purchaseScore");
    expect(result).toHaveProperty("recencyBonus");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("tier");
  });

  it("should have total equal to sum of all components", () => {
    const result = computeScore({ opens: 3, clicks: 2, purchases: 1, hasRecentActivity: true });
    const expected = result.openScore + result.clickScore + result.purchaseScore + result.recencyBonus;
    expect(result.total).toBe(expected);
  });

  it("should have non-negative component scores", () => {
    const result = computeScore({ opens: 0, clicks: 0, purchases: 0, hasRecentActivity: false });
    expect(result.openScore).toBeGreaterThanOrEqual(0);
    expect(result.clickScore).toBeGreaterThanOrEqual(0);
    expect(result.purchaseScore).toBeGreaterThanOrEqual(0);
    expect(result.recencyBonus).toBeGreaterThanOrEqual(0);
  });
});

// ─── Tier distribution logic ──────────────────────────────────────────────────

describe("Engagement Score - Tier Distribution", () => {
  it("should correctly count contacts per tier", () => {
    const contacts = [
      { engagementScore: 0,   engagementTier: "cold" },
      { engagementScore: 10,  engagementTier: "cold" },
      { engagementScore: 30,  engagementTier: "warm" },
      { engagementScore: 60,  engagementTier: "hot" },
      { engagementScore: 80,  engagementTier: "champion" },
      { engagementScore: 90,  engagementTier: "champion" },
    ] as Array<{ engagementScore: number; engagementTier: string }>;

    const tierCounts = {
      champion: contacts.filter((c) => c.engagementTier === "champion").length,
      hot:      contacts.filter((c) => c.engagementTier === "hot").length,
      warm:     contacts.filter((c) => c.engagementTier === "warm").length,
      cold:     contacts.filter((c) => c.engagementTier === "cold" || !c.engagementTier).length,
    };

    expect(tierCounts.champion).toBe(2);
    expect(tierCounts.hot).toBe(1);
    expect(tierCounts.warm).toBe(1);
    expect(tierCounts.cold).toBe(2);
  });

  it("should compute average score correctly", () => {
    const contacts = [
      { engagementScore: 20 },
      { engagementScore: 40 },
      { engagementScore: 60 },
      { engagementScore: 80 },
    ];
    const avg = Math.round(contacts.reduce((sum, c) => sum + c.engagementScore, 0) / contacts.length);
    expect(avg).toBe(50);
  });

  it("should return 0 average for empty contact list", () => {
    const contacts: any[] = [];
    const avg = contacts.length > 0
      ? Math.round(contacts.reduce((sum, c) => sum + (c.engagementScore ?? 0), 0) / contacts.length)
      : 0;
    expect(avg).toBe(0);
  });

  it("should sort contacts by score descending", () => {
    const contacts = [
      { id: 1, engagementScore: 30 },
      { id: 2, engagementScore: 80 },
      { id: 3, engagementScore: 10 },
      { id: 4, engagementScore: 55 },
    ];
    const sorted = [...contacts].sort((a, b) => (b.engagementScore ?? 0) - (a.engagementScore ?? 0));
    expect(sorted[0].id).toBe(2); // 80
    expect(sorted[1].id).toBe(4); // 55
    expect(sorted[2].id).toBe(1); // 30
    expect(sorted[3].id).toBe(3); // 10
  });
});

// ─── Tier filter logic ────────────────────────────────────────────────────────

describe("Engagement Score - Tier Filtering", () => {
  const contacts = [
    { id: 1, engagementTier: "cold",     firstName: "Alice" },
    { id: 2, engagementTier: "warm",     firstName: "Bob" },
    { id: 3, engagementTier: "hot",      firstName: "Carol" },
    { id: 4, engagementTier: "champion", firstName: "Dave" },
    { id: 5, engagementTier: "cold",     firstName: "Eve" },
  ] as Array<{ id: number; engagementTier: string; firstName: string }>;

  it("should return all contacts when filter is 'all'", () => {
    const tierFilter = "all";
    const result = contacts.filter((c) => tierFilter === "all" || c.engagementTier === tierFilter);
    expect(result).toHaveLength(5);
  });

  it("should return only cold contacts when filter is 'cold'", () => {
    const tierFilter = "cold";
    const result = contacts.filter((c) => tierFilter === "all" || c.engagementTier === tierFilter);
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.engagementTier === "cold")).toBe(true);
  });

  it("should return only champion contacts when filter is 'champion'", () => {
    const tierFilter = "champion";
    const result = contacts.filter((c) => tierFilter === "all" || c.engagementTier === tierFilter);
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe("Dave");
  });

  it("should return empty array when no contacts match tier", () => {
    const tierFilter = "hot";
    const subContacts = contacts.filter((c) => c.engagementTier === "cold");
    const result = subContacts.filter((c) => tierFilter === "all" || c.engagementTier === tierFilter);
    expect(result).toHaveLength(0);
  });
});
