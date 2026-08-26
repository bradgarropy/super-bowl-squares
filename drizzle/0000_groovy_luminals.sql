CREATE TABLE "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");