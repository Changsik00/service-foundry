-- spec-x-tenant-isolation-hardening: 도메인 테이블 쓰기 강제 (WITH CHECK).
--
-- 읽기(USING)와 대칭으로 INSERT/UPDATE 의 org_id 변조를 차단한다.
-- 컨텍스트 NULL/빈문자열(시스템 컨텍스트·무컨텍스트 쓰기 — provision / invite accept 의
-- runWithSystemTenant)은 허용 → 정당한 cross-org 쓰기 회귀 0.
-- (0012 의 WITH CHECK(true) 를 대체.)

DROP POLICY IF EXISTS "tenant_isolation" ON "organizations";
CREATE POLICY "tenant_isolation" ON "organizations"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR id = NULLIF(current_setting('app.current_org', true), '')::uuid
  );

DROP POLICY IF EXISTS "tenant_isolation" ON "memberships";
CREATE POLICY "tenant_isolation" ON "memberships"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  );

DROP POLICY IF EXISTS "tenant_isolation" ON "invitations";
CREATE POLICY "tenant_isolation" ON "invitations"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  );
