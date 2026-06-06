# Task List: spec-17-01

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
- [x] `git checkout -b spec-17-01-email-adapter`
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: settings 환경변수 + production 가드

**대상 파일**: `apps/api/src/settings.ts`, `apps/api/src/settings.test.ts`

### 2-1. 테스트 작성 (TDD Red)
- [x] `apps/api/src/settings.test.ts` 에 production 가드 테스트 추가
  - `NODE_ENV=production` + `RESEND_API_KEY` 미설정 → `loadSettings` throw
  - `NODE_ENV=production` + `RESEND_API_KEY` 설정 → 정상 로드
- [x] `pnpm turbo run test --filter=api` → 새 테스트 Fail 확인

### 2-2. 구현 (TDD Green)
- [x] `apps/api/src/settings.ts` 에 `RESEND_API_KEY` (optional), `EMAIL_FROM` (default), `FRONTEND_URL` (default) 추가
- [x] `build()` 에 production 가드 추가 (`RESEND_API_KEY` 미설정 시 throw)
- [x] `pnpm turbo run test --filter=api` → 모두 PASS 확인
- [x] Commit: `feat(spec-17-01): add RESEND_API_KEY/EMAIL_FROM/FRONTEND_URL settings + prod guard`

---

## Task 3: createResendNotifier + 이메일 템플릿 구현

**대상 파일**: `packages/backend/notification/package.json`, `packages/backend/notification/src/index.ts`, `packages/backend/notification/src/index.test.ts`

### 3-1. 테스트 작성 (TDD Red)
- [x] `packages/backend/notification/src/index.test.ts` 에 테스트 추가
  - `createResendNotifier`: mock client 주입 → `sendEmail` 호출 시 `client.emails.send` 가 올바른 payload 로 호출됨
  - `createResendNotifier`: `client.emails.send` 가 error 반환 시 throw
  - `buildPasswordResetEmail`: 링크에 token 포함, frontendUrl base 포함
  - `buildEmailVerifyEmail`: 링크에 token 포함
  - `buildInvitationEmail`: orgName, token 포함
- [x] `pnpm turbo run test --filter=@repo/backend-notification` → 새 테스트 Fail 확인

### 3-2. 구현 (TDD Green)
- [x] `packages/backend/notification/src/index.ts` 에 구현:
  - `ResendClient` 타입 정의
  - `createResendNotifier(client, from)` 팩토리
  - `buildPasswordResetEmail(token, frontendUrl)` 템플릿
  - `buildEmailVerifyEmail(token, frontendUrl)` 템플릿
  - `buildInvitationEmail(orgName, token, frontendUrl)` 템플릿
- [x] `pnpm turbo run test --filter=@repo/backend-notification` → 모두 PASS 확인
- [x] Commit: `feat(spec-17-01): implement createResendNotifier + email templates`

---

## Task 4: NestJS 배선 (notifier.provider + 서비스 업데이트)

**대상 파일**:
- `apps/api/src/notification/notifier.provider.ts`
- `apps/api/src/auth/frontend-url.token.ts` (NEW)
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/password-reset.service.ts`
- `apps/api/src/auth/email-verify.service.ts`
- `apps/api/src/auth/password-reset.service.test.ts`
- `apps/api/src/auth/email-verify.service.test.ts`

### 4-1. 테스트 업데이트 (TDD Red)
- [x] `password-reset.service.test.ts` 에 `FRONTEND_URL` mock 프로바이더 추가
- [x] `email-verify.service.test.ts` 에 `FRONTEND_URL` mock 프로바이더 추가
- [x] `pnpm turbo run test --filter=api` → 실패 확인 (FRONTEND_URL 미주입)

### 4-2. 구현 (TDD Green)
- [x] `apps/api/src/auth/frontend-url.token.ts` — `FRONTEND_URL` 심볼 정의
- [x] `apps/api/src/auth/auth.module.ts` — `FRONTEND_URL` 프로바이더 추가 (`settings.FRONTEND_URL`)
- [x] `apps/api/src/auth/password-reset.service.ts` — `@Inject(FRONTEND_URL)` 주입, `buildPasswordResetEmail` 사용
- [x] `apps/api/src/auth/email-verify.service.ts` — `@Inject(FRONTEND_URL)` 주입, `buildEmailVerifyEmail` 사용
- [x] `apps/api/src/notification/notifier.provider.ts` — settings 기반 Resend 선택 로직 추가
- [x] `pnpm turbo run test --filter=api` → 모두 PASS 확인
- [x] Commit: `feat(spec-17-01): wire ResendNotifier in NestJS + link-format email bodies`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **typecheck**: `pnpm turbo run typecheck --filter=@repo/backend-notification --filter=api`
- [ ] **lint**: `pnpm turbo run lint --filter=@repo/backend-notification --filter=api`
- [ ] **전체 테스트**: `pnpm turbo run test --filter=@repo/backend-notification --filter=api` → 모두 PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성** (템플릿 준수)
- [ ] **pr_description.md 작성** (템플릿 준수)
- [ ] **Ship Commit**: `docs(spec-17-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-17-01-email-adapter`
- [ ] **PR 생성**: `/hk-pr-gh` 또는 `gh pr create`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 (+ Ship) |
| **예상 commit 수** | 4 (T2~T4 각 1 + Ship 1) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-06 |
