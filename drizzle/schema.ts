import { serial, decimal, integer, pgTable, text, timestamp, varchar, boolean, json, index } from "drizzle-orm/pg-core";

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
  // Stripe Connect onboarding / verification state
  stripeAccountStatus: varchar("stripeAccountStatus", { length: 32 }).default("none"), // "none" | "pending" | "verified" | "restricted"
  stripeChargesEnabled: boolean("stripeChargesEnabled").default(false),
  stripePayoutsEnabled: boolean("stripePayoutsEnabled").default(false),
  stripeOnboardedAt: timestamp("stripeOnboardedAt"),
  // Bank details for payouts (encrypted)
  bankAccountHolderName: varchar("bankAccountHolderName", { length: 255 }),
  bankSortCode: varchar("bankSortCode", { length: 10 }), // UK Sort Code (e.g., 12-34-56)
  bankAccountNumber: varchar("bankAccountNumber", { length: 20 }), // UK Account Number (8 digits)
  bankDetailsVerified: boolean("bankDetailsVerified").default(false), // Admin verification flag
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  roleIdx: index("users_role_idx").on(table.role),
  stripeCustomerIdx: index("users_stripe_customer_idx").on(table.stripeCustomerId),
}));

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
}, (table) => ({
  userIdIdx: index("instructors_user_id_idx").on(table.userId),
}));

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"), // Cover image (flyer vertical 17:25) - shown in event cards
  bannerUrl: text("bannerUrl"), // Banner image (horizontal) - shown at top of event detail page
  venue: varchar("venue", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }),
  eventDate: timestamp("eventDate").notNull(),
  eventEndDate: timestamp("eventEndDate"),
  ticketPrice: decimal("ticketPrice", { precision: 10, scale: 2 }).notNull(),
  maxTickets: integer("maxTickets"),
  ticketsSold: integer("ticketsSold").default(0),
  status: varchar("status", { length: 255 }).default("draft"),
  paymentMethod: varchar("paymentMethod", { length: 255 }).default("online"), // Payment method: "online", "cash", or "both"
  allowCashPayment: boolean("allowCashPayment").default(false), // Allow cash payment at door
  allowOnlinePayment: boolean("allowOnlinePayment").default(true), // Allow Stripe online payment
  cashPaymentInstructions: text("cashPaymentInstructions"), // Instructions for cash payment (e.g., "Pay at the door")
  showLowTicketAlert: boolean("showLowTicketAlert").default(false), // Show "Only X tickets left!" message
  creatorId: integer("creatorId"), // User ID of the event creator (instructor/promoter/admin)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("events_status_idx").on(table.status),
  creatorIdIdx: index("events_creator_id_idx").on(table.creatorId),
  eventDateIdx: index("events_date_idx").on(table.eventDate),
}));

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"), // Legacy: URL to course video on S3 (deprecated, lessons now use Bunny.net)
  instructorId: integer("instructorId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  level: varchar("level", { length: 255 }).default("all-levels"),
  danceStyle: varchar("danceStyle", { length: 255 }), // e.g., "Salsa", "Bachata", "Reggaeton"
  duration: varchar("duration", { length: 255 }), // e.g., "4 weeks", "8 hours"
  lessonsCount: integer("lessonsCount"),
  status: varchar("status", { length: 255 }).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  instructorIdIdx: index("courses_instructor_id_idx").on(table.instructorId),
  statusIdx: index("courses_status_idx").on(table.status),
  levelIdx: index("courses_level_idx").on(table.level),
}));

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
  videoUrl: text("videoUrl"), // Legacy: For recorded classes (deprecated, use Bunny.net)
  bunnyVideoId: varchar("bunnyVideoId", { length: 255 }), // Bunny.net Video GUID for recorded classes
  bunnyLibraryId: varchar("bunnyLibraryId", { length: 255 }), // Bunny.net Library ID
  status: varchar("status", { length: 255 }).default("draft"),
  hasSocial: boolean("hasSocial").default(false), // Whether there's a social event after the class
  socialTime: varchar("socialTime", { length: 255 }), // Time of the social event (e.g., "22:00")
  socialLocation: varchar("socialLocation", { length: 255 }), // Location of the social event
  socialDescription: text("socialDescription"), // Description of the social event
  paymentMethod: varchar("paymentMethod", { length: 255 }).default("online"), // Payment method: "online", "cash", or "both"
  allowCashPayment: boolean("allowCashPayment").default(false), // Allow cash payment at door
  allowOnlinePayment: boolean("allowOnlinePayment").default(true), // Allow Stripe online payment
  cashPaymentInstructions: text("cashPaymentInstructions"), // Instructions for cash payment
  materialsUrl: text("materialsUrl"), // URL to class materials (PDF, ZIP, etc.) stored on Bunny CDN
  materialsFileName: varchar("materialsFileName", { length: 255 }), // Original filename for display
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  instructorIdIdx: index("classes_instructor_id_idx").on(table.instructorId),
  statusIdx: index("classes_status_idx").on(table.status),
  classDateIdx: index("classes_class_date_idx").on(table.classDate),
}));

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
  livemode: boolean("livemode").default(true).notNull(), // Track test vs production transactions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Event Ticket Tiers — optional multi-tier pricing for an event
// (e.g. Early Bird, General Admission, VIP). If an event has zero rows here,
// it falls back to the single flat events.ticketPrice/maxTickets.
export const eventTicketTiers = pgTable("eventTicketTiers", {
  id: serial("id").primaryKey(),
  eventId: integer("eventId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxQuantity: integer("maxQuantity"),         // null = unlimited
  soldCount: integer("soldCount").default(0).notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("event_ticket_tiers_event_idx").on(table.eventId),
}));

// Event Tickets table (user purchases for events)
export const eventTickets = pgTable("eventTickets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  eventId: integer("eventId").notNull(),
  tierId: integer("tierId"), // FK to eventTicketTiers.id — null for flat-price (legacy) tickets
  orderId: integer("orderId"),
  quantity: integer("quantity").default(1),
  instructorId: integer("instructorId"),
  pricePaid: decimal("pricePaid", { precision: 10, scale: 2 }),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }),
  instructorEarnings: decimal("instructorEarnings", { precision: 10, scale: 2 }),
  ticketCode: varchar("ticketCode", { length: 255 }).unique(),
  status: varchar("status", { length: 255 }).default("valid"),
  paymentStatus: varchar("paymentStatus", { length: 20 }).default("paid"), // "paid", "pending_cash", "pending_online", "cancelled", "guest"
  paymentMethod: varchar("paymentMethod", { length: 20 }), // "online", "cash", "transfer", "guest"
  paidAt: timestamp("paidAt"), // When payment was actually received (for cash: at check-in)
  reservedAt: timestamp("reservedAt"), // When reservation was made (for cash reservations)
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
  // Guest list fields (populated only when paymentStatus = "guest")
  guestName: varchar("guestName", { length: 255 }),
  guestEmail: varchar("guestEmail", { length: 320 }),
  guestAddedBy: integer("guestAddedBy"), // user id of admin/creator who added this guest
}, (table) => ({
  userIdIdx: index("event_tickets_user_id_idx").on(table.userId),
  eventIdIdx: index("event_tickets_event_id_idx").on(table.eventId),
  statusIdx: index("event_tickets_status_idx").on(table.status),
  paymentStatusIdx: index("event_tickets_payment_status_idx").on(table.paymentStatus),
  tierIdIdx: index("event_tickets_tier_id_idx").on(table.tierId),
}));

export type EventTicketTier = typeof eventTicketTiers.$inferSelect;
export type InsertEventTicketTier = typeof eventTicketTiers.$inferInsert;

// Course Purchases table
export const coursePurchases = pgTable("coursePurchases", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  courseId: integer("courseId").notNull(),
  instructorId: integer("instructorId"), // The user ID of the instructor (not their profile ID)
  orderId: integer("orderId"),
  pricePaid: decimal("pricePaid", { precision: 10, scale: 2 }),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }),
  instructorEarnings: decimal("instructorEarnings", { precision: 10, scale: 2 }),
  progress: integer("progress").default(0), // percentage 0-100
  completed: boolean("completed").default(false),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("course_purchases_user_id_idx").on(table.userId),
  courseIdIdx: index("course_purchases_course_id_idx").on(table.courseId),
  instructorIdIdx: index("course_purchases_instructor_id_idx").on(table.instructorId),
}));

// Class Ticket Tiers — optional multi-tier pricing for a class
// (e.g. Drop-in, Monthly Pass, Class + Social). Falls back to classes.price
// when the class has zero rows here.
export const classTicketTiers = pgTable("classTicketTiers", {
  id: serial("id").primaryKey(),
  classId: integer("classId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxQuantity: integer("maxQuantity"),         // null = unlimited
  soldCount: integer("soldCount").default(0).notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  classIdIdx: index("class_ticket_tiers_class_idx").on(table.classId),
}));

// Class Purchases table
export const classPurchases = pgTable("classPurchases", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  classId: integer("classId").notNull(),
  tierId: integer("tierId"), // FK to classTicketTiers.id — null for flat-price (legacy)
  instructorId: integer("instructorId"),
  orderId: integer("orderId"),
  pricePaid: decimal("pricePaid", { precision: 10, scale: 2 }),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }),
  instructorEarnings: decimal("instructorEarnings", { precision: 10, scale: 2 }),
  accessCode: varchar("accessCode", { length: 255 }).unique(),
  status: varchar("status", { length: 255 }).default("active"),
  paymentStatus: varchar("paymentStatus", { length: 20 }).default("paid"), // "paid", "pending_cash", "pending_online", "cancelled"
  paymentMethod: varchar("paymentMethod", { length: 20 }), // "online", "cash", "transfer"
  paidAt: timestamp("paidAt"), // When payment was actually received (for cash: at check-in)
  reservedAt: timestamp("reservedAt"), // When reservation was made (for cash reservations)
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
}, (table) => ({
  userIdIdx: index("class_purchases_user_id_idx").on(table.userId),
  classIdIdx: index("class_purchases_class_id_idx").on(table.classId),
  instructorIdIdx: index("class_purchases_instructor_id_idx").on(table.instructorId),
  paymentStatusIdx: index("class_purchases_payment_status_idx").on(table.paymentStatus),
  tierIdIdx: index("class_purchases_tier_id_idx").on(table.tierId),
}));

export type ClassTicketTier = typeof classTicketTiers.$inferSelect;
export type InsertClassTicketTier = typeof classTicketTiers.$inferInsert;

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

// Password Reset Tokens table (forgot-password flow)
export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
  userIdx: index("password_reset_tokens_user_idx").on(table.userId),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

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
  videoUrl: text("videoUrl"),                    // Legacy: S3 / CDN URL (deprecated, use Bunny.net)
  bunnyVideoId: varchar("bunnyVideoId", { length: 255 }), // Bunny.net Video GUID
  bunnyLibraryId: varchar("bunnyLibraryId", { length: 255 }), // Bunny.net Library ID
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

// ─── Financial Tables ───────────────────────────────────────────────────────

/**
 * Balances table — tracks the current financial state of instructors/promoters.
 * pendingBalance: money from recent sales not yet cleared for withdrawal (if applicable).
 * currentBalance: cleared funds available for withdrawal.
 */
export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(), // One balance per teacher/promoter
  currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  pendingBalance: decimal("pendingBalance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalEarned: decimal("totalEarned", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 12, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Ledger Transactions — the immutable history of all financial movements.
 * Every credit (earning) or debit (withdrawal) is recorded here.
 */
export const ledgerTransactions = pgTable("ledgerTransactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // Positive for earnings, negative for withdrawals
  type: varchar("type", { length: 50 }).notNull(), // 'earning', 'withdrawal', 'refund_debit', 'adjustment'
  description: text("description"),
  orderId: integer("orderId"), // Link to orders if it's an earning
  status: varchar("status", { length: 50 }).default("completed").notNull(), // 'pending', 'completed', 'cancelled'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Withdrawal Requests — track payout requests from users.
 */
export const withdrawalRequests = pgTable("withdrawalRequests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'approved', 'paid', 'rejected'
  adminNotes: text("adminNotes"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  // Bank details provided by user when requesting withdrawal
  accountHolderName: varchar("accountHolderName", { length: 255 }), // Full name for bank transfer
  sortCode: varchar("sortCode", { length: 20 }), // UK Sort Code (XX-XX-XX format)
  accountNumber: varchar("accountNumber", { length: 20 }), // UK Account Number (8 digits)
  // paymentProofUrl: text("paymentProofUrl"), // Statement/proof of bank transfer (uploaded by admin) - NOT YET IMPLEMENTED
  processedAt: timestamp("processedAt"),
  processedBy: integer("processedBy"), // Admin who handled it
});

export type Balance = typeof balances.$inferSelect;
export type InsertBalance = typeof balances.$inferInsert;

export type LedgerTransaction = typeof ledgerTransactions.$inferSelect;
export type InsertLedgerTransaction = typeof ledgerTransactions.$inferInsert;

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

// ─── Instructor Application Requests ──────────────────────────────────────────

/**
 * Instructor Application Requests — users can request to become instructors/promoters
 * and gain permissions to publish events, classes, and courses.
 */
export const instructorApplications = pgTable("instructorApplications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  requestType: varchar("requestType", { length: 50 }).notNull(), // 'instructor', 'promoter'
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'approved', 'rejected'

  // Application details
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  bio: text("bio"), // Tell us about yourself
  experience: text("experience"), // Dance/teaching experience
  specialties: text("specialties"), // Dance styles (JSON array)
  instagramHandle: varchar("instagramHandle", { length: 255 }),
  websiteUrl: text("websiteUrl"),

  // What they want to publish
  interestedInEvents: boolean("interestedInEvents").default(false),
  interestedInClasses: boolean("interestedInClasses").default(false),
  interestedInCourses: boolean("interestedInCourses").default(false),

  // Email Marketing Preferences
  emailUpdates: boolean("emailUpdates").default(true),
  emailPromotions: boolean("emailPromotions").default(false),
  emailCommunity: boolean("emailCommunity").default(true),

  // Admin review
  adminNotes: text("adminNotes"),
  reviewedBy: integer("reviewedBy"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewedAt"),

  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("instructor_applications_user_id_idx").on(table.userId),
  statusIdx: index("instructor_applications_status_idx").on(table.status),
}));

export type InstructorApplication = typeof instructorApplications.$inferSelect;
export type InsertInstructorApplication = typeof instructorApplications.$inferInsert;

/**
 * Collaborators table - tracks revenue splits for events, classes, and courses
 * Allows creators to share revenue with one collaborator (50/50 or 60/40 split)
 */
export const collaborators = pgTable("collaborators", {
  id: serial("id").primaryKey(),

  // What item is being collaborated on
  itemType: varchar("itemType", { length: 20 }).notNull(), // 'event', 'class', 'course'
  itemId: integer("itemId").notNull(), // ID of the event/class/course

  // Who are the collaborators
  creatorId: integer("creatorId").notNull(), // User ID of the creator (original owner)
  collaboratorId: integer("collaboratorId").notNull(), // User ID of the collaborator

  // Revenue split percentages (must add up to 100)
  creatorPercentage: integer("creatorPercentage").notNull().default(50), // 50 or 60
  collaboratorPercentage: integer("collaboratorPercentage").notNull().default(50), // 50 or 40

  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  // Index for fast lookups
  itemIdx: index("collaborators_item_idx").on(table.itemType, table.itemId),
  creatorIdx: index("collaborators_creator_idx").on(table.creatorId),
  collaboratorIdx: index("collaborators_collaborator_idx").on(table.collaboratorId),
}));

export type Collaborator = typeof collaborators.$inferSelect;
export type InsertCollaborator = typeof collaborators.$inferInsert;

// ── Discount codes ──────────────────────────────────────────────────
export const discountCodes = pgTable("discountCodes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: varchar("discountType", { length: 20 }).notNull(), // "percentage" or "fixed"
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  eventId: integer("eventId"),
  classId: integer("classId"),
  courseId: integer("courseId"),
  // Optional tier scoping: when set, the discount only applies to items
  // purchased on the matching tier. Used together with eventId or classId.
  eventTierId: integer("eventTierId"),
  classTierId: integer("classTierId"),
  maxUses: integer("maxUses"),
  usesCount: integer("usesCount").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdBy: integer("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("discount_codes_code_idx").on(table.code),
}));

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = typeof discountCodes.$inferInsert;

// ─── RRP (Relaciones Públicas / Street Team) ─────────────────────────────────

/** Application to become an RRP — admin approves or rejects. */
export const rrpApplications = pgTable("rrpApplications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  motivation: text("motivation"),
  socialHandle: varchar("socialHandle", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // "pending" | "approved" | "rejected"
  adminNotes: text("adminNotes"),
  reviewedBy: integer("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("rrp_applications_status_idx").on(table.status),
}));

/** Approved RRP profile — unique code, current tier, lifetime counters. */
export const rrpProfiles = pgTable("rrpProfiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  tier: varchar("tier", { length: 20 }).default("bronze").notNull(), // "bronze" | "silver" | "gold" | "platinum" | "diamond"
  lifetimeSales: integer("lifetimeSales").default(0).notNull(),
  lifetimeEarnings: decimal("lifetimeEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  active: boolean("active").default(true).notNull(),
  approvedBy: integer("approvedBy"),
  approvedAt: timestamp("approvedAt").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("rrp_profiles_code_idx").on(table.code),
}));

/** Per-event RRP assignment: event creator decides who can sell + rates. */
export const eventRrps = pgTable("eventRrps", {
  id: serial("id").primaryKey(),
  eventId: integer("eventId").notNull(),
  rrpUserId: integer("rrpUserId").notNull(),
  customerDiscountPct: integer("customerDiscountPct").default(0).notNull(), // 0-100
  rrpCommissionPct: integer("rrpCommissionPct").notNull(),                  // 0-40
  active: boolean("active").default(true).notNull(),
  assignedBy: integer("assignedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventRrpIdx: index("event_rrps_event_rrp_idx").on(table.eventId, table.rrpUserId),
  eventIdx: index("event_rrps_event_idx").on(table.eventId),
  rrpIdx: index("event_rrps_rrp_idx").on(table.rrpUserId),
}));

/** Individual sale attributed to an RRP — source of truth for tier + earnings. */
export const rrpSales = pgTable("rrpSales", {
  id: serial("id").primaryKey(),
  rrpUserId: integer("rrpUserId").notNull(),
  eventId: integer("eventId").notNull(),
  orderId: integer("orderId"),
  buyerUserId: integer("buyerUserId").notNull(),
  ticketPrice: decimal("ticketPrice", { precision: 10, scale: 2 }).notNull(),       // original price
  customerDiscount: decimal("customerDiscount", { precision: 10, scale: 2 }).notNull(),
  rrpCommission: decimal("rrpCommission", { precision: 10, scale: 2 }).notNull(),
  commissionPct: integer("commissionPct").notNull(),
  creditedToBalance: boolean("creditedToBalance").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  rrpIdx: index("rrp_sales_rrp_idx").on(table.rrpUserId),
  eventIdx: index("rrp_sales_event_idx").on(table.eventId),
}));

export type RrpApplication = typeof rrpApplications.$inferSelect;
export type InsertRrpApplication = typeof rrpApplications.$inferInsert;
export type RrpProfile = typeof rrpProfiles.$inferSelect;
export type InsertRrpProfile = typeof rrpProfiles.$inferInsert;
export type EventRrp = typeof eventRrps.$inferSelect;
export type InsertEventRrp = typeof eventRrps.$inferInsert;
export type RrpSale = typeof rrpSales.$inferSelect;
export type InsertRrpSale = typeof rrpSales.$inferInsert;

/** RRP tier table: ordered by required sales, each tier has a minimum commission %. */
export const RRP_TIERS = [
  { key: "bronze",   label: "Bronce",   minSales: 0,   minCommissionPct: 15 },
  { key: "silver",   label: "Plata",    minSales: 15,  minCommissionPct: 20 },
  { key: "gold",     label: "Oro",      minSales: 40,  minCommissionPct: 25 },
  { key: "platinum", label: "Platino",  minSales: 100, minCommissionPct: 30 },
  { key: "diamond",  label: "Diamante", minSales: 250, minCommissionPct: 40 },
] as const;

export const RRP_MAX_COMMISSION_PCT = 40;

export function tierForSales(totalSales: number): typeof RRP_TIERS[number] {
  let current: typeof RRP_TIERS[number] = RRP_TIERS[0];
  for (const t of RRP_TIERS) {
    if (totalSales >= t.minSales) current = t;
  }
  return current;
}
