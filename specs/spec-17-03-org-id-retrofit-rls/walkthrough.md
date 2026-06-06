# Walkthrough: spec-17-03

## 변경 요약

기존 8개 테이블에 `org_id uuid NULL` 컬럼을 추가하고, 퍼미시브 RLS(Row Level Security) 정책을 적용했다.

## 주요 결정 사항

### 1. users.orgId에 .references() 생략

`users.ts` → `organizations.ts` → `users.ts` 순환 참조가 발생해 TypeScript 타입 추론이 `any`로 깨진다. Drizzle 스키마 선언에서는 `.references()` 없이 `uuid("org_id")`만 선언하고, FK 제약은 migration SQL(`0010_org_id_columns.sql`)에 직접 추가했다.

### 2. 패키지 스키마에 orgId 추가 (FK 선언 없음)

`auth-session`, `auth-rate-limit`, `auth-audit` 패키지 테이블에는 `orgId` 컬럼만 추가하고 FK 선언은 생략했다. 이 패키지들은 `organizations` 테이블을 알아서는 안 되는 인프라 패키지 — 앱 레이어에서 값을 채워 넣는 방식.

### 3. 퍼미시브 RLS

`current_setting('app.current_org', true) IS NULL` 시 전체 허용. 기존 테스트/연결은 컨텍스트를 설정하지 않으므로 그대로 통과한다. spec-17-05에서 커넥션 풀이 `SET app.current_org`를 주입하면 자동으로 strict 모드로 전환된다.

### 4. RLS migration 분리

drizzle-kit은 RLS policy를 snapshot에 추적하지 않는다. `0011_rls_policies.sql`을 수동 작성하고 `_journal.json`에 직접 엔트리를 추가했다.

## 파일 변경 내역

| 파일 | 변경 |
|---|---|
| `apps/api/src/infra/schema/users.ts` | MODIFY — `orgId uuid NULL` 추가 |
| `packages/backend/auth-session/src/schema.ts` | MODIFY — `orgId uuid NULL` 추가 |
| `packages/backend/auth-rate-limit/src/schema.ts` | MODIFY — failedLogins + lockouts `orgId` 추가 |
| `packages/backend/auth-audit/src/audit-log.schema.ts` | MODIFY — `orgId uuid NULL` 추가 |
| `apps/api/drizzle/0010_org_id_columns.sql` | GENERATED+수정 — ALTER TABLE × 5 + users FK |
| `apps/api/drizzle/0011_rls_policies.sql` | NEW (수동) — ENABLE RLS + CREATE POLICY × 8 |
| `packages/backend/auth-rate-limit/src/fake-store.ts` | FIX — orgId:null 픽스처 추가 |
| `packages/backend/auth-session/src/session.test.ts` | FIX — orgId:null 픽스처 추가 |
| `apps/api/src/auth/signin.service.test.ts` | FIX — orgId:null 픽스처 추가 |
| `apps/api/src/auth/signup.service.test.ts` | FIX — orgId:null 픽스처 추가 |

## 검증

- typecheck PASS (4개 패키지 + api)
- lint PASS (경고만)
- e2e: vitest-config 미빌드 pre-existing 이슈로 실행 불가 (이 spec 무관 — 별도 추적 필요)
