-- spec-17-08: RLS 를 org-스코프 *도메인* 테이블로 한정 (spec-17-03 과대적용 정정).
--
-- auth 인프라(users·sessions·failed_logins·lockouts·auth_audit_logs)는 org-스코프 도메인
-- 데이터가 아니다:
--   - users 는 멤버십으로 다중 org 에 속할 수 있는 전역 엔티티(home org 컬럼은 분석용).
--   - sessions 는 per-user, login 시점은 무컨텍스트.
--   - failed_logins/lockouts 는 per-IP/account, 인증 전 평가.
-- 이 테이블에 tenant RLS 를 강제하면 인증 요청이 컨텍스트를 설정할 때 세션/유저 조회가
-- 회귀(org_id 불일치/NULL → 안 보임)한다. RLS 를 제거하고, 격리는 도메인 테이블
-- (organizations·memberships·invitations)에만 적용한다. org_id 컬럼은 분석용으로 유지.

DROP POLICY IF EXISTS "tenant_isolation" ON "users";
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "sessions";
ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "failed_logins";
ALTER TABLE "failed_logins" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "lockouts";
ALTER TABLE "lockouts" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "auth_audit_logs";
ALTER TABLE "auth_audit_logs" DISABLE ROW LEVEL SECURITY;

-- organizations · memberships · invitations 의 RLS/정책은 유지 (0012).
