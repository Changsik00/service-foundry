# task: spec-07-03-auth-passkey

## Pre-flight
- [x] branch: spec-07-03-auth-passkey (base: phase-07-auth-extension)
- [x] current.json 갱신

## Tasks

### Task 1: DB 스키마 + 마이그레이션
- [x] `passkey_credentials` 테이블 스키마
- [x] `passkey_challenges` 테이블 스키마
- [x] `apps/api/src/infra/schema/index.ts` + `local.ts` 등록
- [x] `drizzle-kit generate` + 마이그레이션 파일

### Task 2: `@repo/backend-auth-passkey` 패키지
- [x] `pnpm-workspace.yaml` catalog에 `@simplewebauthn/server: ^13.1.1` 추가
- [x] 패키지 신설: `packages/backend/auth-passkey/`
- [x] `types.ts` — `PasskeyConfig`, `StoredCredential`
- [x] `registration.ts` — `generateRegistrationOpts`, `verifyRegistration`
- [x] `authentication.ts` — `generateAuthenticationOpts`, `verifyAuthentication`
- [x] `index.ts` + `AuthenticationResponseJSON`, `RegistrationResponseJSON` 재export
- [x] `apps/api/package.json`에 `@repo/backend-auth-passkey` 의존성 추가

### Task 3: PasskeyStore + PasskeyService + 단위 테스트
- [x] `passkey.stores.ts` — 인터페이스 + Drizzle 구현
- [x] `passkey.service.ts` — 4개 메서드
- [x] `passkey.service.test.ts` — 8개 단위 테스트

### Task 4: PasskeyController + AuthModule 등록 + E2E 테스트
- [x] `passkey.controller.ts` — 4개 엔드포인트 (ZodError → 400)
- [x] `auth.module.ts` — PasskeyService, PASSKEY_STORE, PasskeyController 등록
- [x] `auth.e2e.test.ts` — Passkey 수직 슬라이스 6개 테스트
- [x] DB 마이그레이션 적용

### Task 5: Ship
- [x] walkthrough.md
- [x] pr_description.md
- [x] sdd ship commit + push + PR
