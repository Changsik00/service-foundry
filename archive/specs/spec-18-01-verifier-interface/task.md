# Task List: spec-18-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-18.md SPEC 표 sdd 자동 갱신)
- [x] 사용자 Plan Accept

---

## Task 1: AccessTokenVerifier 인터페이스 + NativeVerifier 스텁 (TDD Red)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-18-01-verifier-interface`
- [x] Commit: 없음 (브랜치 생성만)

### 1-2. 스텁 + 테스트 작성 (TDD Red)
- [x] `packages/nestjs/auth/src/verifier.ts` 생성:
  - `VerifiedIdentity` 타입
  - `AccessTokenVerifier` 인터페이스
  - `ACCESS_TOKEN_VERIFIER` DI 토큰
  - `NativeVerifier` 스텁 (`throw new Error('not implemented')`)
- [x] `packages/nestjs/auth/src/verifier.test.ts` 작성:
  - 유효 token → `{ sub, role, orgId }` 반환
  - `activeOrgId` 클레임 → `orgId` 매핑
  - 만료 token → `UnauthorizedException` throw
  - role 클레임 없음 → `UnauthorizedException` throw
  - Authorization 헤더 없음 → `UnauthorizedException` throw
- [x] `pnpm --filter @repo/nestjs-auth test` → FAIL 확인 (스텁이 throw)
- [x] Commit: `test(spec-18-01): NativeVerifier 단위 테스트 + 스텁 (Red)`

---

## Task 2: NativeVerifier 구현 (TDD Green)

### 2-1. NativeVerifier 구현
- [x] `packages/nestjs/auth/src/verifier.ts`의 `NativeVerifier.verify()` 구현:
  - `verifyAccessToken(token, keyStore, { issuer, audience })`
  - `Role.safeParse(result.value.role)`
  - `ACTIVE_ORG_CLAIM` → `orgId` 추출
- [x] `pnpm --filter @repo/nestjs-auth test` → PASS 확인
- [x] Commit: `refactor(spec-18-01): NativeVerifier 구현 (Green)`

---

## Task 3: AuthGuard 리팩터 + 모듈 배선

### 3-1. AuthGuard · module · auth.module.ts · index.ts 일괄 변경
- [x] `packages/nestjs/auth/src/auth.guard.ts`:
  - `@Inject(NESTJS_AUTH_OPTIONS)` → `@Inject(ACCESS_TOKEN_VERIFIER)`
  - `canActivate` 내 검증 로직 → `verifier.verify(token)` 호출로 교체
- [x] `packages/nestjs/auth/src/auth.guard.test.ts`:
  - `new AuthGuard(opts)` → `new AuthGuard(new NativeVerifier(opts))`
- [x] `packages/nestjs/auth/src/module.ts`:
  - `forRoot`: `NativeVerifier` 생성 후 `ACCESS_TOKEN_VERIFIER` provide
  - `forRootAsync`: factory 결과로 `NativeVerifier` 생성
- [x] `packages/nestjs/auth/src/index.ts`:
  - `AccessTokenVerifier`, `ACCESS_TOKEN_VERIFIER`, `NativeVerifier`, `VerifiedIdentity` export 추가
- [x] `apps/api/src/auth/auth.module.ts`:
  - `ACCESS_TOKEN_VERIFIER` provider 추가 (`NativeVerifier` factory)
- [x] `pnpm --filter @repo/nestjs-auth test` → PASS
- [x] `pnpm --filter @apps/api test` → PASS (tenant-isolation.http.e2e — DB 미기동 pre-existing 실패, 내 변경 무관)
- [x] Commit: `refactor(spec-18-01): AuthGuard verifier DI 주입 리팩터 + 모듈 배선`

---

## Task 4: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm --filter @repo/nestjs-auth lint` → PASS
- [ ] `pnpm --filter @repo/nestjs-auth typecheck` → PASS
- [ ] `pnpm --filter @repo/nestjs-auth test` → PASS
- [ ] `pnpm --filter @apps/api test` → PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-18-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-18-01-verifier-interface`
- [ ] **PR 생성**: `phase-18-auth-authority-mode` base branch 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 4 (Red + Green + Refactor + Ship) |
| **현재 단계** | Task 4 (Ship) |
| **마지막 업데이트** | 2026-06-09 |
