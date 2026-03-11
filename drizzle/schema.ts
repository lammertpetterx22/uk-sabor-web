import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 512 }),
  role: mysqlEnum("role", ["user", "instructor", "promoter", "admin"]).default("user").notNull(),
  roles: text("roles"), // JSON array of all roles for multi-role support
  // Subscription plan (denormalised for fast access)
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["starter", "creator", "promoter_plan", "academy"]).default("starter").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }), // Stripe Connect ID for receiving split payments
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Helper to parse roles from JSON string
export function parseRoles(rolesJson: string | null | undefined): string[] {
  if (!rolesJson) return [];
  try {
    return JSON.parse(rolesJson);
  } catch {
    return [];
  }
}

// Helper to serialize roles to JSON string
export function serializeRoles(roles: string[]): string {
  return JSON.stringify(roles);
}

// Get all roles for a user (primary role + additional roles)
export function getAllRoles(user: User): string[] {
  const allRoles = [user.role];
  const additionalRoles = parseRoles(user.roles);
  const combined = [...allRoles, ...additionalRoles];
  return Array.from(new Set(combined));
}

// Instructors table
export const instructors = mysqlTable("instructors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Links to users.id for self-service profile editing
  name: varchar("name", { length: 255 }).notNull(),
  bio: text("bio"),
  photoUrl: text("photoUrl"),
  instagramHandle: varchar("instagramHandle", { length: 255 }),
  websiteUrl: text("websiteUrl"),
  specialties: text("specialties"), // JSON array as string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Events table
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  venue: varchar("venue", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }),
  eventDate: timestamp("eventDate").notNull(),
  eventEndDate: timestamp("eventEndDate"),
  ticketPrice: decimal("ticketPrice", { precision: 10, scale: 2 }).notNull(),
  maxTickets: int("maxTickets"),
  ticketsSold: int("ticketsSold").default(0),
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft"),
  paymentMethod: mysqlEnum("paymentMethod", ["online", "cash", "both"]).default("online"), // Payment method: Stripe online, cash, or both
  creatorId: int("creatorId"), // User ID of the event creator (instructor/promoter/admin)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Courses table
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"), // URL to course video on S3
  instructorId: int("instructorId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced", "all-levels"]).default("all-levels"),
  danceStyle: varchar("danceStyle", { length: 255 }), // e.g., "Salsa", "Bachata", "Reggaeton"
  duration: varchar("duration", { length: 255 }), // e.g., "4 weeks", "8 hours"
  lessonsCount: int("lessonsCount"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Classes table
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructorId: int("instructorId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  danceStyle: varchar("danceStyle", { length: 255 }),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced", "all-levels"]).default("all-levels"),
  classDate: timestamp("classDate").notNull(),
  duration: int("duration"), // in minutes
  maxParticipants: int("maxParticipants"),
  currentParticipants: int("currentParticipants").default(0),
  imageUrl: text("imageUrl"), // Cover image for the class
  videoUrl: text("videoUrl"), // For recorded classes
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft"),
  hasSocial: boolean("hasSocial").default(false), // Whether there's a social event after the class
  socialTime: varchar("socialTime", { length: 255 }), // Time of the social event (e.g., "22:00")
  socialLocation: varchar("socialLocation", { length: 255 }), // Location of the social event
  socialDescription: text("socialDescription"), // Description of the social event
  paymentMethod: mysqlEnum("paymentMethod", ["online", "cash", "both"]).default("online"), // Payment method: Stripe online, cash, or both
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Orders table (for payment tracking)
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("GBP"),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending"),
  itemType: mysqlEnum("itemType", ["event", "course", "class"]).notNull(),
  itemId: int("itemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Event Tickets table (user purchases for events)
export const eventTickets = mysqlTable("eventTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: int("eventId").notNull(),
  orderId: int("orderId"),
  quantity: int("quantity").default(1),
  ticketCode: varchar("ticketCode", { length: 255 }).unique(),
  status: mysqlEnum("status", ["valid", "used", "cancelled"]).default("valid"),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

// Course Purchases table
export const coursePurchases = mysqlTable("coursePurchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  orderId: int("orderId"),
  progress: int("progress").default(0), // percentage 0-100
  completed: boolean("completed").default(false),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// Class Purchases table
export const classPurchases = mysqlTable("classPurchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId").notNull(),
  orderId: int("orderId"),
  accessCode: varchar("accessCode", { length: 255 }).unique(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

// Type exports
export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = typeof instructors.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type EventTicket = typeof eventTickets.$inferSelect;
export type InsertEventTicket = typeof eventTickets.$inferInsert;

export type CoursePurchase = typeof coursePurchases.$inferSelect;
export type InsertCoursePurchase = typeof coursePurchases.$inferInsert;

export type ClassPurchase = typeof classPurchases.$inferSelect;
export type InsertClassPurchase = typeof classPurchases.$inferInsert;

// CRM Contacts table
export const crmContacts = mysqlTable("crmContacts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 255 }),
  country: varchar("country", { length: 255 }),
  postalCode: varchar("postalCode", { length: 20 }),
  segment: mysqlEnum("segment", ["lead", "customer", "vip", "inactive"]).default("lead"),
  status: mysqlEnum("status", ["active", "inactive", "unsubscribed"]).default("active"),
  source: varchar("source", { length: 255 }), // e.g., "website", "instagram", "event"
  lastContactDate: timestamp("lastContactDate"),
  totalPurchases: decimal("totalPurchases", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  // Engagement scoring (0-100, computed from opens + clicks + purchases)
  engagementScore: int("engagementScore").default(0),
  engagementTier: mysqlEnum("engagementTier", ["cold", "warm", "hot", "champion"]).default("cold"),
  scoreUpdatedAt: timestamp("scoreUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// CRM Interactions table (emails, calls, messages)
export const crmInteractions = mysqlTable("crmInteractions", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  type: mysqlEnum("type", ["email", "call", "message", "meeting", "note"]).notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  status: mysqlEnum("status", ["pending", "completed", "follow_up"]).default("pending"),
  scheduledDate: timestamp("scheduledDate"),
  completedDate: timestamp("completedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// CRM Notes table
export const crmNotes = mysqlTable("crmNotes", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  content: text("content").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Type exports for CRM
export type CRMContact = typeof crmContacts.$inferSelect;
export type InsertCRMContact = typeof crmContacts.$inferInsert;

export type CRMInteraction = typeof crmInteractions.$inferSelect;
export type InsertCRMInteraction = typeof crmInteractions.$inferInsert;

export type CRMNote = typeof crmNotes.$inferSelect;
export type InsertCRMNote = typeof crmNotes.$inferInsert;
// QR Codes table (for check-in system)
export const qrCodes = mysqlTable("qrCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  itemType: mysqlEnum("itemType", ["event", "class"]).notNull(),
  itemId: int("itemId").notNull(),
  userId: int("userId"), // null = venue QR (for instructor), set = personal QR (for attendee)
  orderId: int("orderId"), // link to the purchase order
  qrData: text("qrData").notNull(),
  isUsed: boolean("isUsed").default(false).notNull(), // true after first scan - QR is single-use
  usedAt: timestamp("usedAt"), // when the QR was scanned
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Attendance table (check-in records)
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["event", "class"]).notNull(),
  itemId: int("itemId").notNull(),
  qrCodeId: int("qrCodeId"),
  checkedInAt: timestamp("checkedInAt").defaultNow().notNull(),
  checkedInBy: int("checkedInBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Class Instructors junction table (many-to-many: classes <-> instructors)
export const classInstructors = mysqlTable("classInstructors", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  instructorId: int("instructorId").notNull(),
  role: mysqlEnum("role", ["lead", "assistant"]).default("lead"), // lead = primary, assistant = co-instructor
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClassInstructor = typeof classInstructors.$inferSelect;
export type InsertClassInstructor = typeof classInstructors.$inferInsert;

// Type exports for QR/Attendance
export type QRCode = typeof qrCodes.$inferSelect;
export type InsertQRCode = typeof qrCodes.$inferInsert;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

// ─── Email Marketing Tables ───────────────────────────────────────────────────

// Email Templates table (reusable templates for campaigns)
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["event", "course", "class", "promotion", "newsletter", "custom"]).default("custom"),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  isDefault: boolean("isDefault").default(false), // system-provided default templates
  createdBy: int("createdBy"), // admin user id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Email Campaigns table (sent or scheduled bulk emails)
export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  templateId: int("templateId"), // optional link to template used
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "failed"]).default("draft"),
  scheduledAt: timestamp("scheduledAt"), // null = send immediately
  sentAt: timestamp("sentAt"),
  totalRecipients: int("totalRecipients").default(0),
  totalSent: int("totalSent").default(0),
  totalOpened: int("totalOpened").default(0),
  totalClicked: int("totalClicked").default(0),
  segment: mysqlEnum("segment", ["all", "lead", "customer", "vip", "inactive"]).default("all"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Email Opens tracking (one row per contact open)
export const emailOpens = mysqlTable("emailOpens", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  contactId: int("contactId").notNull(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
});

// Email Clicks tracking (one row per link click)
export const emailClicks = mysqlTable("emailClicks", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  contactId: int("contactId").notNull(),
  url: text("url").notNull(),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
});

// Type exports for Email Marketing
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

export type EmailOpen = typeof emailOpens.$inferSelect;
export type EmailClick = typeof emailClicks.$inferSelect;

// ─── Subscription Tables ──────────────────────────────────────────────────────

// Subscriptions table — one active subscription per user
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["starter", "creator", "promoter_plan", "academy"]).notNull().default("starter"),
  status: mysqlEnum("status", ["active", "cancelled", "past_due", "trialing", "incomplete"]).notNull().default("active"),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Usage tracking — monthly counters per user
export const usageTracking = mysqlTable("usageTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  periodYear: int("periodYear").notNull(),   // e.g. 2026
  periodMonth: int("periodMonth").notNull(), // 1–12
  eventsCreated: int("eventsCreated").default(0).notNull(),
  classesCreated: int("classesCreated").default(0).notNull(),
  coursesCreated: int("coursesCreated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Type exports for Subscriptions
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;

// ─── LMS: Lessons & Progress ──────────────────────────────────────────────────

/**
 * Lessons table — individual video lessons within a course.
 * Sequential position enforces the unlock order: lesson N+1 locked until N completes.
 */
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),           // FK → courses.id
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl"),                    // S3 / CDN URL (protected stream)
  position: int("position").notNull(),           // 1-based sequential order
  durationSeconds: int("durationSeconds"),       // Used for auto-complete threshold
  isPreview: boolean("isPreview").default(false).notNull(), // Free preview without purchase
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

/**
 * Lesson progress — one row per (user, lesson) pair.
 * watchPercent is updated continuously; completed flips to true at ≥95 %.
 * The UNIQUE constraint (userId, lessonId) prevents duplicate rows.
 */
export const lessonProgress = mysqlTable("lessonProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),               // FK → users.id
  lessonId: int("lessonId").notNull(),           // FK → lessons.id
  watchPercent: int("watchPercent").default(0).notNull(), // 0-100
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;
