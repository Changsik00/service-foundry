# Implementation Plan: spec-17-03

## 📋 Branch Strategy

- 신규 브랜치: `spec-17-03-org-id-retrofit-rls`
- 시작 지점: `phase-17`
- **PR 타겟**: `phase-17`
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 패키지(`auth-session`, `auth-rate-limit`, `auth-audit`) 스키마에 `org_id uuid NULL`을 추가함. 이 패키지들은 내부 패키지이므로 다른 앱에는 영향 없음. 동의하면 Accept.
> - [ ] RLS는 현재 **퍼미시브** (컨텍스트 미설정 시 전체 허용). strict 전환은 spec-17-05에서 처리.

> [!WARNING]
> - [ ] `ALTER TABLE sessions/failed_logins/lockouts/auth_audit_logs ADD COLUMN org_id` — 기존 행은 NULL. 애플리케이션 코드 영향 없음(nullable).
> - [ ] RLS ENABLE + POLICY 적용 후 `app.current_org` 가 설정된 연결에서는 즉시 필터링 동작. 현재는 아무 연결도 설정하지 않으므로 사실상 무해.

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
[Task 2] org_id 컬럼 추가 (drizzle-kit)
  users.ts (app-local)      → Drizzle 스키마 수정 → drizzle-kit이 migration 생성
  auth-session/schema.ts    → Drizzle 스키마 수정 → drizzle-kit이 migration 생성
  auth-rate-limit/schema.ts → Drizzle 스키마 수정 → drizzle-kit이 migration 생성
  auth-audit/schema.ts      → Drizzle 스키마 수정 → drizzle-kit이 migration 생성

[Task 3] RLS (raw SQL migration 수동 작성)
  0010_rls_policies.sql     → ENABLE RLS + CREATE POLICY 8개 테이블
  _journal.json             → 수동 엔트리 추가

[검증]
  typecheck 전 패키지 → apps/api
  e2e: pnpm turbo run test:e2e --filter=api
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 패키지 스키마 수정 | org_id nullable 추가 | drizzle-kit이 diff를 감지해 migration 자동 생성. FK 선언은 앱 레이어에서 관리. |
| RLS 방식 | 퍼미시브 (current_setting IS NULL OR match) | spec-17-05 이전까지 기존 e2e 회귀 없이 인프라 준비. |
| RLS migration 분리 | raw SQL `0010_rls_policies.sql` | drizzle-kit은 RLS policy를 관리하지 않음. 수동 SQL 파일로 분리해 명시성 확보. |

- [x] ADR 없음

## 📂 Proposed Changes

### [Task 2] org_id 컬럼 추가

#### [MODIFY] `apps/api/src/infra/schema/users.ts`

```typescript
import { organizations } from "./organizations.js";

export const users = pgTable("users", {
  // ... 기존 컬럼 유지 ...
  orgId: uuid("org_id").references(() => organizations.id),  // nullable FK
});
```

#### [MODIFY] `packages/backend/auth-session/src/schema.ts`

```typescript
orgId: uuid("org_id"),  // nullable, FK 선언 없음 (패키지-앱 순환 의존 방지)
```

#### [MODIFY] `packages/backend/auth-rate-limit/src/schema.ts`

`failedLogins` + `lockouts` 양쪽에:
```typescript
orgId: uuid("org_id"),  // nullable
```

#### [MODIFY] `packages/backend/auth-audit/src/audit-log.schema.ts`

```typescript
orgId: uuid("org_id"),  // nullable
```

#### [GENERATE] `apps/api/drizzle/0010_org_id_columns.sql`

`drizzle-kit generate` 실행 → 5개 테이블 ALTER TABLE ADD COLUMN.

### [Task 3] RLS policies

#### [NEW] `apps/api/drizzle/0011_rls_policies.sql` (수동 작성)

```sql
-- users
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

-- memberships, invitations, sessions, failed_logins, lockouts, auth_audit_logs
-- (각각 org_id 기준 동일 패턴)
```

`_journal.json`에 수동으로 `0011_rls_policies` 엔트리 추가.

## 🧪 검증 계획

### 타입체크

```bash
pnpm turbo run typecheck \
  --filter=@repo/backend-auth-session \
  --filter=@repo/backend-auth-rate-limit \
  --filter=@repo/backend-auth-audit \
  --filter=@apps/api
```

### e2e (회귀 검증)

```bash
pnpm turbo run test:e2e --filter=@apps/api
```

### 수동 DB 검증

```sql
-- RLS 정책 확인
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN (
  'users','organizations','memberships','invitations',
  'sessions','failed_logins','lockouts','auth_audit_logs'
);

-- 격리 확인 (컨텍스트 설정 시 필터링)
SET app.current_org = '<org-uuid-A>';
SELECT count(*) FROM organizations;  -- 1개만 보여야 함
```

## 🔁 Rollback Plan

- `ALTER TABLE ... DROP COLUMN org_id` (nullable 추가라서 데이터 손실 없음)
- `DROP POLICY tenant_isolation ON <table>; ALTER TABLE <table> DISABLE ROW LEVEL SECURITY`
- drizzle migration 파일 + journal 엔트리 삭제

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
