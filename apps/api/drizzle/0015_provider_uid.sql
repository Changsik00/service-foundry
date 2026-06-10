ALTER TABLE "users" ADD COLUMN "provider_uid" text;
CREATE UNIQUE INDEX "users_provider_uid_unique" ON "users"("provider_uid");
