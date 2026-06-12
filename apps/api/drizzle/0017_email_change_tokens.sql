CREATE TABLE "email_change_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"new_email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamptz NOT NULL,
	"used_at" timestamptz,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "email_change_tokens_token_hash_unique" UNIQUE("token_hash")
);
