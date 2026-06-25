-- organizations.public_id (ADR-0028, spec-26-05). gen_public_id 는 0021 에서 생성됨.
-- VOLATILE default → ADD COLUMN 시 기존 org 행도 행별 평가되어 백필됨.
ALTER TABLE "organizations" ADD COLUMN "public_id" text DEFAULT gen_public_id('org') NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_public_id_unique" UNIQUE("public_id");