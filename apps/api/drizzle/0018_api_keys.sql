-- spec-19-06: org 스코프 API Key 테이블
-- 평문은 저장하지 않는다 — SHA-256(plain_key) 해시만 보관.
-- key_preview: 평문 앞 8자 (표시용, 비밀 아님).

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id"           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id"       UUID        NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name"         TEXT        NOT NULL,
  "key_hash"     TEXT        NOT NULL UNIQUE,
  "key_preview"  TEXT        NOT NULL,
  "last_used_at" TIMESTAMPTZ,
  "revoked_at"   TIMESTAMPTZ,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON "api_keys"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON "api_keys" TO app_runtime;
