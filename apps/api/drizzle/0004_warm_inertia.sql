CREATE TABLE "auth_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
