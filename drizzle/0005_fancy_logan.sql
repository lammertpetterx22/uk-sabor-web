CREATE TABLE "instructorApplications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"requestType" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(20),
	"bio" text,
	"experience" text,
	"specialties" text,
	"instagramHandle" varchar(255),
	"websiteUrl" text,
	"interestedInEvents" boolean DEFAULT false,
	"interestedInClasses" boolean DEFAULT false,
	"interestedInCourses" boolean DEFAULT false,
	"adminNotes" text,
	"reviewedBy" integer,
	"reviewedAt" timestamp,
	"requestedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "instructor_applications_user_id_idx" ON "instructorApplications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "instructor_applications_status_idx" ON "instructorApplications" USING btree ("status");