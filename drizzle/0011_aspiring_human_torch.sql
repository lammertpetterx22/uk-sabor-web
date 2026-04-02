CREATE TABLE "collaborators" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemType" varchar(20) NOT NULL,
	"itemId" integer NOT NULL,
	"creatorId" integer NOT NULL,
	"collaboratorId" integer NOT NULL,
	"creatorPercentage" integer DEFAULT 50 NOT NULL,
	"collaboratorPercentage" integer DEFAULT 50 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "collaborators_item_idx" ON "collaborators" USING btree ("itemType","itemId");--> statement-breakpoint
CREATE INDEX "collaborators_creator_idx" ON "collaborators" USING btree ("creatorId");--> statement-breakpoint
CREATE INDEX "collaborators_collaborator_idx" ON "collaborators" USING btree ("collaboratorId");