-- Permissive RLS: current_org 미설정 시 전체 허용, 설정 시 매칭 행만 허용.
-- strict 전환은 spec-17-05 (SET app.current_org 매커니즘 활성화 후).

-- users (org_id 기준)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "users"
  USING (
    current_setting('app.current_org', true) IS NULL
    OR org_id = current_setting('app.current_org', true)::uuid
  );

-- organizations (자신이 org — id 기준)
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "organizations"
  USING (
    current_setting('app.current_org', true) IS NULL
    OR id = current_setting('app.current_org', true)::uuid
  );

-- memberships
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "memberships"
  USING (
    current_setting('app.current_org', true) IS NULL
    OR org_id = current_setting('app.current_org', true)::uuid
  );

-- invitations
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "invitations"
  USING (
    current_setting('app.current_org', true) IS NULL
    OR org_id = current_setting('app.current_org', true)::uuid
  );

-- sessions
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sessions"
  USING (
    current_setting('app.current_org', true) IS NULL
    OR org_id = current_setting('app.current_org', true)::uuid
  );

-- failed_logins
ALTER TABLE "failed_logins" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "failed_logins"
  USING (
    current_setting('app.current_org', true) IS NULL
    OR org_id = current_setting('app.current_org', true)::uuid
  );

-- lockouts
ALTER TABLE "lockouts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "lockouts"
  USING (
    current_setting('app.current_org', true) IS NULL
    OR org_id = current_setting('app.current_org', true)::uuid
  );

-- auth_audit_logs
ALTER TABLE "auth_audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "auth_audit_logs"
  USING (
    current_setting('app.current_org', true) IS NULL
    OR org_id = current_setting('app.current_org', true)::uuid
  );
