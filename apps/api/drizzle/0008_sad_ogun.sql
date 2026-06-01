CREATE TABLE "failed_logins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"account_key" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lockouts" (
	"account_key" text PRIMARY KEY NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unlock_at" timestamp with time zone NOT NULL,
	"streak" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "failed_logins_ip_at_idx" ON "failed_logins" USING btree ("ip","attempted_at");--> statement-breakpoint
CREATE INDEX "failed_logins_account_at_idx" ON "failed_logins" USING btree ("account_key","attempted_at");