import { serial, decimal, integer, pgTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 512 }),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  role: varchar("role", { length: 255 }).default("user").notNull(),
  roles: text("roles"), // JSON array of all roles for multi-role support
  // Subscription plan (denormalised for fast access)
  subscriptionPlan: varchar("subscriptionPlan", { length: 255 }).default("starter").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }), // Stripe Connect ID for receiving split payments
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
export const instructors = pgTable("instructors", {
  id: serial("id").primaryKey(),
  userId: integer("userId"), // Links to users.id for self-service profile editing
  name: varchar("name", { length: 255 }).notNull(),
  bio: text("bio"),
  photoUrl: text("photoUrl"),
  instagramHandle: varchar("instagramHandle", { length: 255 }),
  websiteUrl: text("websiteUrl"),
  specialties: text("specialties"), // JSON array as string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  venue: varchar("venue", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }),
  eventDate: timestamp("eventDate").notNull(),
  eventEndDate: timestamp("eventEndDate"),
  ticketPrice: decimal("ticketPrice", { precision: 10, scale: 2 }).notNull(),
  maxTickets: integer("maxTickets"),
  ticketsSold: integer("ticketsSold").default(0),
  status: varchar("status", { length: 255 }).default("draft"),
  paymentMethod: varchar("paymentMethod", { length: 255 }).default("online"), // Payment method: Stripe online, cash, or both
  creatorId: integer("creatorId"), // User ID of the event creator (instructor/promoter/admin)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"), // URL to course video on S3
  instructorId: integer("instructorId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  level: varchar("level", { length: 255 }).default("all-levels"),
  danceStyle: varchar("danceStyle", { length: 255 }), // e.g., "Salsa", "Bachata", "Reggaeton"
  duration: varchar("duration", { length: 255 }), // e.g., "4 weeks", "8 hours"
  lessonsCount: integer("lessonsCount"),
  status: varchar("status", { length: 255 }).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Classes table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructorId: integer("instructorId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  danceStyle: varchar("danceStyle", { length: 255 }),
  level: varchar("level", { length: 255 }).default("all-levels"),
  classDate: timestamp("classDate").notNull(),
  duration: integer("duration"), // in minutes
  maxParticipants: integer("maxParticipants"),
  currentParticipants: integer("currentParticipants").default(0),
  imageUrl: text("imageUrl"), // Cover image for the class
  videoUrl: text("videoUrl"), // For recorded classes
  status: varchar("status", { length: 255 }).default("draft"),
  hasSocial: boolean("hasSocial").default(false), // Whether there's a social event after the class
  socialTime: varchar("socialTime", { length: 255 }), // Time of the social event (e.g., "22:00")
  socialLocation: varchar("socialLocation", { length: 255 }), // Location of the social event
  socialDescription: text("socialDescription"), // Description of the social event
  paymentMethod: varchar("paymentMethod", { length: 255 }).default("online"), // Payment method: Stripe online, cash, or both
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Orders table (for payment tracking)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("GBP"),
  status: varchar("status", { length: 255 }).default("pending"),
  itemType: varchar("itemType", { length: 255 }).notNull(),
  itemId: integer("itemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Event Tickets table (user purchases for events)
export const eventTickets = pgTable("eventTickets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  eventId: integer("eventId").notNull(),
  orderId: integer("orderId"),
  quantity: integer("quantity").default(1),
  ticketCode: varchar("ticketCode", { length: 255 }).unique(),
  status: varchar("status", { length: 255 }).default("valid"),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

// Course Purchases table
export const coursePurchases = pgTable("coursePurchases", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  courseId: integer("courseId").notNull(),
  orderId: integer("orderId"),
  progress: integer("progress").default(0), // percentage 0-100
  completed: boolean("completed").default(false),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// Class Purchases table
export const classPurchases = pgTable("classPurchases", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  classId: integer("classId").notNull(),
  orderId: integer("orderId"),
  accessCode: varchar("accessCode", { length: 255 }).unique(),
  status: varchar("status", { length: 255 }).default("active"),
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
export const crmContacts = pgTable("crmContacts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 255 }),
  country: varchar("country", { length: 255 }),
  postalCode: varchar("postalCode", { length: 20 }),
  segment: varchar("segment", { length: 255 }).default("lead"),
  status: varchar("status", { length: 255 }).default("active"),
  source: varchar("source", { length: 255 }), // e.g., "website", "instagram", "event"
  lastContactDate: timestamp("lastContactDate"),
  totalPurchases: decimal("totalPurchases", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  // Engagement scoring (0-100, computed from opens + clicks + purchases)
  engagementScore: integer("engagementScore").default(0),
  engagementTier: varchar("engagementTier", { length: 255 }).default("cold"),
  scoreUpdatedAt: timestamp("scoreUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// CRM Interactions table (emails, calls, messages)
export const crmInteractions = pgTable("crmInteractions", {
  id: serial("id").primaryKey(),
  contactId: integer("contactId").notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  status: varchar("status", { length: 255 }).default("pending"),
  scheduledDate: timestamp("scheduledDate"),
  completedDate: timestamp("completedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// CRM Notes table
export const crmNotes = pgTable("crmNotes", {
  id: serial("id").primaryKey(),
  contactId: integer("contactId").notNull(),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 255 }).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Type exports for CRM
export type CRMContact = typeof crmContacts.$inferSelect;
export type InsertCRMContact = typeof crmContacts.$inferInsert;

export type CRMInteraction = typeof crmInteractions.$inferSelect;
export type InsertCRMInteraction = typeof crmInteractions.$inferInsert;

export type CRMNote = typeof crmNotes.$inferSelect;
export type InsertCRMNote = typeof crmNotes.$inferInsert;
// QR Codes table (for check-in system)
export const qrCodes = pgTable("qrCodes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  itemType: varchar("itemType", { length: 255 }).notNull(),
  itemId: integer("itemId").notNull(),
  userId: integer("userId"), // null = venue QR (for instructor), set = personal QR (for attendee)
  orderId: integer("orderId"), // link to the purchase order
  qrData: text("qrData").notNull(),
  isUsed: boolean("isUsed").default(false).notNull(), // true after first scan - QR is single-use
  usedAt: timestamp("usedAt"), // when the QR was scanned
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Attendance table (check-in records)
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  itemType: varchar("itemType", { length: 255 }).notNull(),
  itemId: integer("itemId").notNull(),
  qrCodeId: integer("qrCodeId"),
  checkedInAt: timestamp("checkedInAt").defaultNow().notNull(),
  checkedInBy: integer("checkedInBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Class Instructors junction table (many-to-many: classes <-> instructors)
export const classInstructors = pgTable("classInstructors", {
  id: serial("id").primaryKey(),
  classId: integer("classId").notNull(),
  instructorId: integer("instructorId").notNull(),
  role: varchar("role", { length: 255 }).default("lead"), // lead = primary, assistant = co-instructor
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
export const emailTemplates = pgTable("emailTemplates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).default("custom"),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  isDefault: boolean("isDefault").default(false), // system-provided default templates
  createdBy: integer("createdBy"), // admin user id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Email Campaigns table (sent or scheduled bulk emails)
export const emailCampaigns = pgTable("emailCampaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  templateId: integer("templateId"), // optional link to template used
  status: varchar("status", { length: 255 }).default("draft"),
  scheduledAt: timestamp("scheduledAt"), // null = send immediately
  sentAt: timestamp("sentAt"),
  totalRecipients: integer("totalRecipients").default(0),
  totalSent: integer("totalSent").default(0),
  totalOpened: integer("totalOpened").default(0),
  totalClicked: integer("totalClicked").default(0),
  segment: varchar("segment", { length: 255 }).default("all"),
  createdBy: integer("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Email Opens tracking (one row per contact open)
export const emailOpens = pgTable("emailOpens", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull(),
  contactId: integer("contactId").notNull(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
});

// Email Clicks tracking (one row per link click)
export const emailClicks = pgTable("emailClicks", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull(),
  contactId: integer("contactId").notNull(),
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
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  plan: varchar("plan", { length: 255 }).notNull().default("starter"),
  status: varchar("status", { length: 255 }).notNull().default("active"),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Usage tracking — monthly counters per user
export const usageTracking = pgTable("usageTracking", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  periodYear: integer("periodYear").notNull(),   // e.g. 2026
  periodMonth: integer("periodMonth").notNull(), // 1–12
  eventsCreated: integer("eventsCreated").default(0).notNull(),
  classesCreated: integer("classesCreated").default(0).notNull(),
  coursesCreated: integer("coursesCreated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("courseId").notNull(),           // FK → courses.id
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl"),                    // S3 / CDN URL (protected stream)
  position: integer("position").notNull(),           // 1-based sequential order
  durationSeconds: integer("durationSeconds"),       // Used for auto-complete threshold
  isPreview: boolean("isPreview").default(false).notNull(), // Free preview without purchase
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

/**
 * Lesson progress — one row per (user, lesson) pair.
 * watchPercent is updated continuously; completed flips to true at ≥95 %.
 * The UNIQUE constraint (userId, lessonId) prevents duplicate rows.
 */
export const lessonProgress = pgTable("lessonProgress", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),               // FK → users.id
  lessonId: integer("lessonId").notNull(),           // FK → lessons.id
  watchPercent: integer("watchPercent").default(0).notNull(), // 0-100
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;
