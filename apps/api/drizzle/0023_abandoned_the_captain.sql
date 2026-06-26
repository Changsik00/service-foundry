-- sessions/api_keys public_id (ADR-0028, spec-26-06). gen_public_id 는 0021. VOLATILE default = 자동 백필.
ALTER TABLE "sessions" ADD COLUMN "public_id" text DEFAULT gen_public_id('ses') NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_public_id_unique" UNIQUE("public_id");--> statement-breakpoint
-- api_keys 는 drizzle local.ts 미등록(hand-written 관리, 0018) — 수동 추가.
ALTER TABLE "api_keys" ADD COLUMN "public_id" text DEFAULT gen_public_id('key') NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_public_id_unique" UNIQUE("public_id");