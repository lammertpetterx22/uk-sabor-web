CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"itemType" varchar(255) NOT NULL,
	"itemId" integer NOT NULL,
	"qrCodeId" integer,
	"checkedInAt" timestamp DEFAULT now() NOT NULL,
	"checkedInBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classInstructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"classId" integer NOT NULL,
	"instructorId" integer NOT NULL,
	"role" varchar(255) DEFAULT 'lead',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classPurchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"classId" integer NOT NULL,
	"orderId" integer,
	"accessCode" varchar(255),
	"status" varchar(255) DEFAULT 'active',
	"purchasedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	CONSTRAINT "classPurchases_accessCode_unique" UNIQUE("accessCode")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"instructorId" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"danceStyle" varchar(255),
	"level" varchar(255) DEFAULT 'all-levels',
	"classDate" timestamp NOT NULL,
	"duration" integer,
	"maxParticipants" integer,
	"currentParticipants" integer DEFAULT 0,
	"imageUrl" text,
	"videoUrl" text,
	"status" varchar(255) DEFAULT 'draft',
	"hasSocial" boolean DEFAULT false,
	"socialTime" varchar(255),
	"socialLocation" varchar(255),
	"socialDescription" text,
	"paymentMethod" varchar(255) DEFAULT 'online',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coursePurchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"orderId" integer,
	"progress" integer DEFAULT 0,
	"completed" boolean DEFAULT false,
	"purchasedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"imageUrl" text,
	"videoUrl" text,
	"instructorId" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"level" varchar(255) DEFAULT 'all-levels',
	"danceStyle" varchar(255),
	"duration" varchar(255),
	"lessonsCount" integer,
	"status" varchar(255) DEFAULT 'draft',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crmContacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"firstName" varchar(255),
	"lastName" varchar(255),
	"phone" varchar(20),
	"address" text,
	"city" varchar(255),
	"country" varchar(255),
	"postalCode" varchar(20),
	"segment" varchar(255) DEFAULT 'lead',
	"status" varchar(255) DEFAULT 'active',
	"source" varchar(255),
	"lastContactDate" timestamp,
	"totalPurchases" numeric(10, 2) DEFAULT '0',
	"notes" text,
	"engagementScore" integer DEFAULT 0,
	"engagementTier" varchar(255) DEFAULT 'cold',
	"scoreUpdatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crmContacts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "crmInteractions" (
	"id" serial PRIMARY KEY NOT NULL,
	"contactId" integer NOT NULL,
	"type" varchar(255) NOT NULL,
	"subject" varchar(255),
	"content" text,
	"status" varchar(255) DEFAULT 'pending',
	"scheduledDate" timestamp,
	"completedDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crmNotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"contactId" integer NOT NULL,
	"content" text NOT NULL,
	"priority" varchar(255) DEFAULT 'medium',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailCampaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"htmlContent" text NOT NULL,
	"templateId" integer,
	"status" varchar(255) DEFAULT 'draft',
	"scheduledAt" timestamp,
	"sentAt" timestamp,
	"totalRecipients" integer DEFAULT 0,
	"totalSent" integer DEFAULT 0,
	"totalOpened" integer DEFAULT 0,
	"totalClicked" integer DEFAULT 0,
	"segment" varchar(255) DEFAULT 'all',
	"createdBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailClicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaignId" integer NOT NULL,
	"contactId" integer NOT NULL,
	"url" text NOT NULL,
	"clickedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "emailOpens" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaignId" integer NOT NULL,
	"contactId" integer NOT NULL,
	"openedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" varchar(45),
	"userAgent" varchar(512)
);
--> statement-breakpoint
CREATE TABLE "emailTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(255) DEFAULT 'custom',
	"subject" varchar(500) NOT NULL,
	"htmlContent" text NOT NULL,
	"isDefault" boolean DEFAULT false,
	"createdBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventTickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"eventId" integer NOT NULL,
	"orderId" integer,
	"quantity" integer DEFAULT 1,
	"ticketCode" varchar(255),
	"status" varchar(255) DEFAULT 'valid',
	"purchasedAt" timestamp DEFAULT now() NOT NULL,
	"usedAt" timestamp,
	CONSTRAINT "eventTickets_ticketCode_unique" UNIQUE("ticketCode")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"imageUrl" text,
	"venue" varchar(255) NOT NULL,
	"city" varchar(255),
	"eventDate" timestamp NOT NULL,
	"eventEndDate" timestamp,
	"ticketPrice" numeric(10, 2) NOT NULL,
	"maxTickets" integer,
	"ticketsSold" integer DEFAULT 0,
	"status" varchar(255) DEFAULT 'draft',
	"paymentMethod" varchar(255) DEFAULT 'online',
	"creatorId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"name" varchar(255) NOT NULL,
	"bio" text,
	"photoUrl" text,
	"instagramHandle" varchar(255),
	"websiteUrl" text,
	"specialties" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessonProgress" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"lessonId" integer NOT NULL,
	"watchPercent" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"videoUrl" text,
	"position" integer NOT NULL,
	"durationSeconds" integer,
	"isPreview" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"stripePaymentIntentId" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP',
	"status" varchar(255) DEFAULT 'pending',
	"itemType" varchar(255) NOT NULL,
	"itemId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qrCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(255) NOT NULL,
	"itemType" varchar(255) NOT NULL,
	"itemId" integer NOT NULL,
	"userId" integer,
	"orderId" integer,
	"qrData" text NOT NULL,
	"isUsed" boolean DEFAULT false NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qrCodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"plan" varchar(255) DEFAULT 'starter' NOT NULL,
	"status" varchar(255) DEFAULT 'active' NOT NULL,
	"stripeSubscriptionId" varchar(255),
	"stripeCustomerId" varchar(255),
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"cancelAtPeriodEnd" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usageTracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"periodYear" integer NOT NULL,
	"periodMonth" integer NOT NULL,
	"eventsCreated" integer DEFAULT 0 NOT NULL,
	"classesCreated" integer DEFAULT 0 NOT NULL,
	"coursesCreated" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"passwordHash" varchar(512),
	"role" varchar(255) DEFAULT 'user' NOT NULL,
	"roles" text,
	"subscriptionPlan" varchar(255) DEFAULT 'starter' NOT NULL,
	"stripeCustomerId" varchar(255),
	"stripeAccountId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
