CREATE TYPE "role" AS ENUM ('user', 'admin');
--> statement-breakpoint
CREATE TABLE "study_workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceKey" varchar(128) NOT NULL,
	"profile" jsonb NOT NULL,
	"tasks" jsonb NOT NULL,
	"subjects" jsonb NOT NULL,
	"logs" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_workspaces_workspaceKey_unique" UNIQUE("workspaceKey")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
