ALTER TABLE "auth_audit_logs" ADD COLUMN "org_id" uuid;--> statement-breakpoint
ALTER TABLE "failed_logins" ADD COLUMN "org_id" uuid;--> statement-breakpoint
ALTER TABLE "lockouts" ADD COLUMN "org_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "org_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;