# Task List: spec-18-02

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

## Task 1: 패키지 스캐폴딩 + FirebaseVerifier 스텁 (TDD Red)

### 1-1. 브랜치 생성

- [ ] `git checkout -b spec-18-02-firebase-backend-verifier` (base: `phase-18-auth-authority-mode`)

### 1-2. pnpm catalog에 firebase-admin 추가

- [ ] `pnpm-workspace.yaml` catalog에 `firebase-admin: "^12.0.0"` 추가

### 1-3. 패키지 파일 생성

- [ ] `packages/nestjs/auth-firebase/package.json` 생성
- [ ] `packages/nestjs/auth-firebase/tsconfig.json` 생성
- [ ] `packages/nestjs/auth-firebase/src/firebase-provision-port.ts` 생성:
  - `FIREBASE_PROVISION_PORT` DI 심볼
  - `FirebaseProvisionPort` 인터페이스 (`provisionFromProvider`)
- [ ] `packages/nestjs/auth-firebase/src/firebase-verifier.ts` 스텁 생성:
  - `FIREBASE_ADMIN_APP` DI 심볼
  - `FirebaseVerifier` 스텁 (`throw new Error('not implemented')`)
- [ ] `packages/nestjs/auth-firebase/src/firebase-auth.module.ts` 스텁:
  - `FirebaseAuthOptions` 타입
  - `NestjsFirebaseAuthModule.forRoot()` 스텁
- [ ] `packages/nestjs/auth-firebase/src/index.ts` 생성 (stub exports)
- [ ] `packages/nestjs/auth-firebase/src/firebase-verifier.test.ts` 작성:
  - `vi.mock('firebase-admin/auth')` + `vi.mock('firebase-admin/app')`
  - 5개 테스트 케이스 (위 spec.md Functional Requirements 참조)
- [ ] `pnpm --filter @repo/nestjs-auth-firebase test` → FAIL 확인 (스텁)
- [ ] `pnpm install` (firebase-admin 설치)
- [ ] Commit: `test(spec-18-02): FirebaseVerifier 단위 테스트 + 패키지 스캐폴딩 (Red)`

---

## Task 2: FirebaseVerifier 구현 (TDD Green)

### 2-1. FirebaseVerifier.verify() 구현

- [ ] `packages/nestjs/auth-firebase/src/firebase-verifier.ts` 구현:
  - `getAuth(app).verifyIdToken(token)` → `DecodedIdToken`
  - `decoded.uid` → `sub`
  - `decoded['role']` → `role` (없으면 `"user"`)
  - `decoded[ACTIVE_ORG_CLAIM]` → `orgId`
  - provisioning 경로: `provisionFromProvider` + `setCustomUserClaims`
- [ ] `pnpm --filter @repo/nestjs-auth-firebase test` → PASS 확인
- [ ] Commit: `feat(spec-18-02): FirebaseVerifier 구현 (Green)`

---

## Task 3: NestjsFirebaseAuthModule + 타입체크 + depcruise

### 3-1. 모듈 구현

- [ ] `packages/nestjs/auth-firebase/src/firebase-auth.module.ts` 완성:
  - `initializeApp({ credential, projectId })` → `FIREBASE_ADMIN_APP` provide
  - `FirebaseVerifier` provider
  - `ACCESS_TOKEN_VERIFIER → FirebaseVerifier` provide
  - `@Optional() FIREBASE_PROVISION_PORT` 처리
- [ ] `packages/nestjs/auth-firebase/src/index.ts` public API 완성
- [ ] `pnpm --filter @repo/nestjs-auth-firebase typecheck` → PASS
- [ ] `pnpm --filter @repo/nestjs-auth-firebase lint` → PASS
- [ ] `pnpm depcruise apps packages --config .dependency-cruiser.cjs` → 위반 없음
- [ ] Commit: `feat(spec-18-02): NestjsFirebaseAuthModule + public API`

---

## Task 4: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm --filter @repo/nestjs-auth-firebase lint` → PASS
- [ ] `pnpm --filter @repo/nestjs-auth-firebase typecheck` → PASS
- [ ] `pnpm --filter @repo/nestjs-auth-firebase test` → PASS
- [ ] `pnpm turbo run typecheck` → PASS (전체 workspace)
- [ ] `pnpm depcruise apps packages --config .dependency-cruiser.cjs` → PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-18-02): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-18-02-firebase-backend-verifier`
- [ ] **PR 생성**: `phase-18-auth-authority-mode` base branch 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 4 (Red + Green + Module + Ship) |
| **현재 단계** | Ship |
| **마지막 업데이트** | 2026-06-09 |
