-- spec-17-07: 테넌트 격리 실효화.
--
-- 1) 비-슈퍼유저 런타임 role `app_runtime` — RLS 가 실제로 적용되는 주체.
--    owner/슈퍼유저(마이그레이션 실행자)는 RLS 를 우회하므로 앱 런타임 접속을 분리한다.
--    비밀번호는 VCS 에 두지 않는다(NOLOGIN). 환경별로 주입:
--      ALTER ROLE app_runtime LOGIN PASSWORD '<env secret>';
-- 2) RLS 정책을 USING(읽기 격리) + WITH CHECK(true)(쓰기 permissive) 로 재생성.
--    본 spec 은 읽기 격리(성공 기준 3)까지 — 쓰기 강제(org_id 변조 차단)는 후속 spec.
--    WITH CHECK(true) 가 없으면 USING 이 INSERT/UPDATE 에도 적용되어 인증 컨텍스트 하
--    정당한 cross-org 쓰기(invite-accept/provision)가 깨진다 → 회귀 방지.

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

-- users (org_id 기준)
DROP POLICY IF EXISTS "tenant_isolation" ON "users";
CREATE POLICY "tenant_isolation" ON "users"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);

-- organizations (자신이 org — id 기준)
DROP POLICY IF EXISTS "tenant_isolation" ON "organizations";
CREATE POLICY "tenant_isolation" ON "organizations"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);

-- memberships
DROP POLICY IF EXISTS "tenant_isolation" ON "memberships";
CREATE POLICY "tenant_isolation" ON "memberships"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);

-- invitations
DROP POLICY IF EXISTS "tenant_isolation" ON "invitations";
CREATE POLICY "tenant_isolation" ON "invitations"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);

-- sessions
DROP POLICY IF EXISTS "tenant_isolation" ON "sessions";
CREATE POLICY "tenant_isolation" ON "sessions"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);

-- failed_logins
DROP POLICY IF EXISTS "tenant_isolation" ON "failed_logins";
CREATE POLICY "tenant_isolation" ON "failed_logins"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);

-- lockouts
DROP POLICY IF EXISTS "tenant_isolation" ON "lockouts";
CREATE POLICY "tenant_isolation" ON "lockouts"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);

-- auth_audit_logs
DROP POLICY IF EXISTS "tenant_isolation" ON "auth_audit_logs";
CREATE POLICY "tenant_isolation" ON "auth_audit_logs"
  USING (
    NULLIF(current_setting('app.current_org', true), '') IS NULL
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid
  )
  WITH CHECK (true);
