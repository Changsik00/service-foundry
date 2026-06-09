# Task List: spec-18-05 — Firebase Custom Token 발행 엔드포인트

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-18.md SPEC 표 sdd 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: FirebaseTokenController TDD Red + 브리지 주석

### 1-1. 브랜치 생성

- [ ] `git checkout -b spec-18-05-firebase-custom-token` (base: `phase-18-auth-authority-mode`)

### 1-2. 테스트 스텁 작성 (TDD Red)

- [ ] `apps/api/src/auth/firebase-token.controller.test.ts` 신규:
  - 케이스 1: `FIREBASE_ADMIN_APP` 있음 → `createCustomToken` 호출 + `{ customToken }` 반환 확인
  - 케이스 2: `FIREBASE_ADMIN_APP` null → `ServiceUnavailableException` (503)
  - 케이스 3: Guard 미통과 (AuthGuard mock 반환 false) → `ForbiddenException`
- [ ] `apps/api/src/auth/firebase-token.controller.ts` 스텁 생성 (throw not implemented)
- [ ] `pnpm --filter @apps/api test -- firebase-token` → FAIL 확인
- [ ] Commit: `test(spec-18-05): FirebaseTokenController 단위 테스트 (Red)`

---

## Task 2: FirebaseTokenController 구현 (TDD Green) + AuthModule 배선

### 2-1. 컨트롤러 구현

- [ ] `apps/api/src/auth/firebase-token.controller.ts` 실구현:
  - 클래스 상단 브리지 패턴 주석 추가
  - `@Optional() @Inject(FIREBASE_ADMIN_APP)` 주입
  - `createCustomToken(user.sub, { active_org_id, org_role })` 호출
  - `FIREBASE_ADMIN_APP` null 시 `ServiceUnavailableException` throw
- [ ] `pnpm --filter @apps/api test -- firebase-token` → PASS 확인

### 2-2. AuthModule 배선

- [ ] `apps/api/src/auth/auth.module.ts`:
  - `settings.FIREBASE_SERVICE_ACCOUNT` 있을 때 `FIREBASE_ADMIN_APP` provider 조건부 등록
  - 앱 이름 `"native-bridge"` 전달 (firebase 모드의 unnamed app과 충돌 방지)
  - `FirebaseTokenController` controllers 배열에 추가
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] Commit: `feat(spec-18-05): FirebaseTokenController + AuthModule 배선 (Green)`

---

## Task 3: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm --filter @apps/api lint` → PASS
- [ ] `pnpm --filter @apps/api typecheck` → PASS
- [ ] `pnpm --filter @apps/api test -- firebase-token` → PASS
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] `pnpm depcruise apps packages --config .dependency-cruiser.cjs` → PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-18-05): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-18-05-firebase-custom-token`
- [ ] **PR 생성**: `phase-18-auth-authority-mode` base branch 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 (Red + Green + Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-09 |
