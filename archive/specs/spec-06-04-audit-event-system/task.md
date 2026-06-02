# Task List: spec-06-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase.md SPEC 표 sdd auto-갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: `packages/backend/auth-audit` 스캐폴드 + AuthEvent + AuthEventBus

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-06-04-audit-event-system` (base: `phase-06-auth-integration`)
- [x] Commit: 없음 (브랜치 생성만)

### 1-2. 테스트 작성 (TDD Red)
- [x] `packages/backend/auth-audit/src/event-bus.test.ts` 작성
  - emit한 이벤트가 on 핸들러에 전달됨
  - 여러 핸들러 동시 등록 가능
  - handler 제거(off) 후 미호출
- [x] `pnpm --filter @repo/backend-auth-audit test` → Fail 확인

### 1-3. 구현 (TDD Green)
- [x] `packages/backend/auth-audit/package.json` — `@repo/backend-auth-audit`
- [x] `packages/backend/auth-audit/tsconfig.json`
- [x] `packages/backend/auth-audit/vitest.config.ts`
- [x] `packages/backend/auth-audit/src/events.ts` — AuthEvent union (8개)
- [x] `packages/backend/auth-audit/src/event-bus.ts` — AuthEventBus (EventEmitter 래퍼)
- [x] `packages/backend/auth-audit/src/index.ts` — public exports
- [x] `pnpm --filter @repo/backend-auth-audit test` → PASS (4/4)
- [x] Commit: `feat(spec-06-04): auth-audit 패키지 스캐폴드 + AuthEvent + AuthEventBus`

---

## Task 2: AuditService + Drizzle schema + migration

### 2-1. 테스트 작성 (TDD Red)
- [x] `packages/backend/auth-audit/src/audit.service.test.ts` 작성
  - mock DB로 `log(SIGNED_IN event)` → INSERT 호출 확인
  - `log(LOGIN_FAILED)` → userId null 허용 확인
- [x] `pnpm --filter @repo/backend-auth-audit test` → Fail 확인 (3 failed)

### 2-2. 구현 (TDD Green)
- [x] `packages/backend/auth-audit/src/audit-log.schema.ts` — auth_audit_logs Drizzle 테이블
- [x] `packages/backend/auth-audit/src/audit-log.store.ts` — AuditLogStore interface
- [x] `packages/backend/auth-audit/src/drizzle-audit-log.store.ts` — Drizzle store 구현
- [x] `packages/backend/auth-audit/src/audit.service.ts` — AuditService
- [x] `packages/backend/auth-audit/src/index.ts` — schema + service export 추가
- [x] `apps/api/src/infra/schema/local.ts` — `authAuditLogs` schema import
- [x] `apps/api/src/infra/schema/index.ts` — `appSchema`에 `authAuditLogs` 추가
- [x] `pnpm --filter @apps/api db:generate` → migration 0004 생성 확인
- [x] `pnpm --filter @repo/backend-auth-audit test` → PASS (7/7)
- [x] Commit: `feat(spec-06-04): AuditService + Drizzle schema + migration 0004`

---

## Task 3: apps/api AuthModule 통합 — emit + AuditEventListener

### 3-1. 테스트 작성 (TDD Red)
- [x] `apps/api/src/auth/auth.controller.test.ts` 수정
  - `AuthEventBus` mock inject
  - signin 성공 시 `SIGNED_IN` emit 검증
  - signin 실패 시 `LOGIN_FAILED` emit 검증
  - signout 시 `SIGNED_OUT` emit 검증
  - refresh 성공 시 `TOKEN_REFRESHED` emit 검증
- [x] `pnpm --filter @apps/api test` → Fail 확인 (5 emit 테스트 실패)

### 3-2. 구현 (TDD Green)
- [x] `apps/api/src/auth/audit.event-listener.ts` — AuditEventListener (onModuleInit 구독)
- [x] `apps/api/src/auth/auth.module.ts` — AuthEventBus + AuditService + AuditEventListener 등록
- [x] `apps/api/src/auth/auth.controller.ts` 수정:
  - `AuthEventBus` inject
  - `signIn()`: `@Req()` 추가, SIGNED_IN / LOGIN_FAILED emit
  - `signUp()`: `@Req()` 추가, SIGNED_IN emit
  - `signOut()`: SIGNED_OUT + SESSION_REVOKED emit
  - `refresh()`: TOKEN_REFRESHED emit
- [x] `pnpm --filter @apps/api test` → 10/10 PASS (emit 5개 추가, e2e 4개는 pre-existing DB 없음)
- [x] Commit: `feat(spec-06-04): apps/api auth 이벤트 emit + AuditEventListener`

---

## Task 4: Ship (필수)

- [ ] `pnpm turbo typecheck` → PASS
- [ ] `pnpm turbo test` → 전체 PASS
- [ ] **walkthrough.md 작성** (증거 로그)
- [ ] **pr_description.md 작성** (템플릿 준수)
- [ ] **Ship Commit**: `docs(spec-06-04): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-06-04-audit-event-system`
- [ ] **PR 생성**: `/hk-pr-gh` 또는 `gh pr create` (base: `phase-06-auth-integration`)
- [ ] **사용자 알림**: 푸시 완료 + PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 (+ Ship) |
| **예상 commit 수** | 4 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-21 |
