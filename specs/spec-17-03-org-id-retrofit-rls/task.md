# Task List: spec-17-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-17.md SPEC 표 자동 갱신됨)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 브랜치 생성

- [x] `git checkout -b spec-17-03-org-id-retrofit-rls` (phase-17에서 분기)
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: org_id 컬럼 추가 + drizzle-kit migration

**단위 테스트 없음** — 순수 스키마 변경. typecheck으로 검증.

**대상 파일**:
- `apps/api/src/infra/schema/users.ts` (MODIFY)
- `packages/backend/auth-session/src/schema.ts` (MODIFY)
- `packages/backend/auth-rate-limit/src/schema.ts` (MODIFY)
- `packages/backend/auth-audit/src/audit-log.schema.ts` (MODIFY)
- `apps/api/drizzle/0010_*.sql` (GENERATED)

### 2-1. 스키마 파일 수정

- [x] `users.ts` — `orgId: uuid("org_id")` 추가 (nullable, 순환 참조 방지로 FK 선언 생략 → migration SQL에 추가)
- [x] `auth-session/schema.ts` — `orgId: uuid("org_id")` 추가 (nullable)
- [x] `auth-rate-limit/schema.ts` — `failedLogins` + `lockouts` 양쪽에 `orgId: uuid("org_id")` 추가
- [x] `auth-audit/schema.ts` — `orgId: uuid("org_id")` 추가
- [x] 픽스처 파일 `orgId: null` 추가 (fake-store, session.test.ts, signin/signup service test)

### 2-2. Migration 생성 + typecheck

- [x] `pnpm --filter ./apps/api exec drizzle-kit generate` 실행
- [x] 생성된 SQL에 5개 `ALTER TABLE ... ADD COLUMN "org_id" uuid` + `users` FK 포함 확인
- [x] `pnpm turbo run typecheck` PASS
- [x] Commit: `feat(spec-17-03): add org_id column to users + auth infrastructure tables`

---

## Task 3: 퍼미시브 RLS migration (raw SQL)

**대상 파일**:
- `apps/api/drizzle/0011_rls_policies.sql` (수동 작성)
- `apps/api/drizzle/meta/_journal.json` (수동 엔트리 추가)

### 3-1. RLS SQL 작성

- [x] `0011_rls_policies.sql` 작성 — 8개 테이블 `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY tenant_isolation`
- [x] `_journal.json`에 `0011_rls_policies` 엔트리 수동 추가
- [x] 수동 검증: SQL 문법 검토 (organizations는 `id` 기준, 나머지는 `org_id` 기준)
- [x] Commit: `feat(spec-17-03): add permissive RLS policies on tenant-scoped tables`

---

## Task 4: e2e 회귀 검증

**Integration Test Required**

### 4-1. 기존 e2e 실행

- [ ] `pnpm turbo run test:e2e --filter=@apps/api` 실행
- [ ] 전체 GREEN 확인 (RLS 퍼미시브이므로 컨텍스트 없어도 통과해야 함)
- [ ] 실패 시 원인 분석 + 수정
- [ ] Commit: 수정 사항 있으면 `fix(spec-17-03): <설명>`, 없으면 Task 4 skip

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **typecheck**: `pnpm turbo run typecheck --filter=@repo/backend-auth-session --filter=@repo/backend-auth-rate-limit --filter=@repo/backend-auth-audit --filter=@apps/api`
- [ ] **lint**: `pnpm turbo run lint --filter=@apps/api`
- [ ] **e2e**: `pnpm turbo run test:e2e --filter=@apps/api` PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-17-03): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-17-03-org-id-retrofit-rls`
- [ ] **PR 생성**: `gh pr create --base phase-17`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 (+ Ship) |
| **예상 commit 수** | 2-3 (T2+T3 + 선택적 T4) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-06 |
