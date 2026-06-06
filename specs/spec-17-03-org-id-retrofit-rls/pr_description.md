# feat(spec-17-03): org_id retrofit + 퍼미시브 RLS

## 개요

기존 테이블 8개에 `org_id uuid NULL` 컬럼을 추가하고 퍼미시브 Row Level Security를 적용한다. spec-17-04(프로비저닝 seam)의 `users.org_id` 쓰기 선행 조건이며, RLS 인프라를 준비해 spec-17-05에서 strict 전환 시 자동 적용된다.

## 변경 내용

### org_id 컬럼 추가 (`0010_org_id_columns.sql`)

```sql
ALTER TABLE "users"           ADD COLUMN "org_id" uuid;  -- FK→organizations
ALTER TABLE "sessions"        ADD COLUMN "org_id" uuid;
ALTER TABLE "failed_logins"   ADD COLUMN "org_id" uuid;
ALTER TABLE "lockouts"        ADD COLUMN "org_id" uuid;
ALTER TABLE "auth_audit_logs" ADD COLUMN "org_id" uuid;
```

- `users.org_id`: FK → organizations(id) (migration에서만 선언 — Drizzle 순환 참조 방지)
- 나머지: nullable, FK 없음 (패키지-앱 의존성 역전 방지)

### 퍼미시브 RLS (`0011_rls_policies.sql`)

8개 테이블 — users, organizations, memberships, invitations, sessions, failed_logins, lockouts, auth_audit_logs:

```sql
ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation"
  USING (current_setting('app.current_org', true) IS NULL
         OR <org_id_col> = current_setting('app.current_org', true)::uuid);
```

`app.current_org` 미설정 시 전체 허용 → 기존 테스트 회귀 없음.

### 픽스처 업데이트

`orgId: null` 추가: `fake-store.ts`, `session.test.ts`, `signin/signup.service.test.ts`

## 기존 코드 영향

- 컬럼 전부 nullable — 기존 INSERT/SELECT 변경 없음
- RLS 퍼미시브 — 컨텍스트 미설정 연결은 영향 없음
- spec-17-05에서 커넥션 풀이 `SET app.current_org`를 주입하는 순간부터 격리 강제

## 검증

- [x] typecheck PASS (4 패키지 + api)
- [x] lint PASS

## 관련

- ADR-0022: 멀티테넌시 전략
- spec-17-02: organizations/memberships 스키마 (선행)
- spec-17-04: users.org_id 데이터 채우기 (이 PR 선행 필요)
- spec-17-05: RLS strict 전환 + SET 매커니즘
