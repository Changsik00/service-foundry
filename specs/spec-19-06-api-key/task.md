# Task List: spec-19-06 API Key

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: 마이그레이션 + Drizzle 스키마

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-19-06-api-key`

### 1-2. 구현
- [ ] `apps/api/drizzle/0018_api_keys.sql` — 테이블 + RLS
- [ ] `apps/api/src/infra/schema/api-keys.ts` — Drizzle pgTable
- [ ] `apps/api/src/infra/schema/index.ts` — apiKeys export + appSchema 추가
- [ ] Commit: `feat(spec-19-06): api_keys 마이그레이션 + Drizzle 스키마`

---

## Task 2: ApiKeyService (TDD)

### 2-1. 테스트 작성 (Red)
- [ ] `apps/api/src/auth/api-key.service.test.ts` 작성
- [ ] typecheck stub 필요 시 throwing stub 먼저 커밋
- [ ] Commit: `test(spec-19-06): ApiKeyService 단위 테스트 (Red)`

### 2-2. 구현 (Green)
- [ ] `apps/api/src/auth/api-key.service.ts` 구현
  - `create(userId, orgId, name)` — randomBytes → SHA-256 → INSERT (raw pool)
  - `list(orgId)` — SELECT non-revoked (raw pool)
  - `revoke(id, orgId)` — UPDATE revokedAt (raw pool)
  - `verifyKey(plain)` — SHA-256 → SELECT → UPDATE lastUsedAt (raw pool)
- [ ] 테스트 → Pass
- [ ] Commit: `feat(spec-19-06): ApiKeyService — create·list·revoke·verifyKey`

---

## Task 3: ApiKeyGuard (TDD)

### 3-1. 테스트 작성 (Red)
- [ ] `apps/api/src/auth/api-key.guard.test.ts` 작성
- [ ] Commit: `test(spec-19-06): ApiKeyGuard 단위 테스트 (Red)`

### 3-2. 구현 (Green)
- [ ] `apps/api/src/auth/api-key.guard.ts` 구현
- [ ] 테스트 → Pass
- [ ] Commit: `feat(spec-19-06): ApiKeyGuard — X-API-Key 검증`

---

## Task 4: ApiKeyController + 배선 (TDD)

### 4-1. 테스트 작성 (Red)
- [ ] `apps/api/src/auth/api-key.controller.test.ts`
- [ ] Commit: `test(spec-19-06): ApiKeyController 단위 테스트 (Red)`

### 4-2. 구현 (Green)
- [ ] `apps/api/src/auth/api-key.controller.ts`
  - `POST /auth/api-keys` (AuthGuard + OrgRolesGuard + @OrgRoles("admin","owner"))
  - `GET /auth/api-keys` (AuthGuard)
  - `DELETE /auth/api-keys/:id` (AuthGuard + OrgRolesGuard + @OrgRoles("admin","owner"))
  - `GET /auth/api-key-verify` (ApiKeyGuard — e2e 검증용)
- [ ] `apps/api/src/auth/auth.module.ts` — ApiKeyService, ApiKeyGuard, ApiKeyController 등록
- [ ] 테스트 → Pass
- [ ] Commit: `feat(spec-19-06): ApiKeyController + AuthModule 배선`

---

## Task 5: e2e

### 5-1. e2e 작성 + 실행
- [ ] `apps/api/src/auth/api-key.e2e.test.ts`
  - owner create → list → `GET /auth/api-key-verify` (X-API-Key) → revoke → 401
  - member create 시도 → 403
- [ ] 테스트 → Pass
- [ ] Commit: `test(spec-19-06): API Key e2e — create·use·revoke`

---

## Task 6: Ship

### 🚦 Pre-Push Quality Gate
- [ ] `pnpm turbo typecheck` → PASS
- [ ] `pnpm turbo test --filter=@apps/api` → PASS (전체)

### 📝 산출물
- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Commit: `docs(spec-19-06): walkthrough·pr_description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-19-06-api-key`
- [ ] PR 생성 (base: `phase-19-account-authz`)

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 |
| **예상 commit 수** | 9 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-13 |
