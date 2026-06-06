# feat(spec-17-01): 이메일 어댑터 — Resend 실 발송 배선

## 📋 Summary

### 배경 및 목적

`packages/backend/notification` 에는 `Notifier` 인터페이스와 dev/noop 어댑터만 존재했다. production/staging 에서 이메일이 실제로 발송되지 않아 비밀번호 재설정, 이메일 인증이 기능 불동작 상태였다. 또한 이메일 본문에 raw 토큰이 평문으로 포함되어 있었다.

본 PR 은 Resend SDK 어댑터 배선, 3종 이메일 링크 템플릿, production 기동 가드를 완성한다.

### 주요 변경 사항
- [x] `createResendNotifier(client, from)` 팩토리 추가 — mock 주입 가능한 DI 패턴
- [x] `buildPasswordResetEmail` / `buildEmailVerifyEmail` / `buildInvitationEmail` 링크 템플릿 추가 (raw 토큰 → URL 링크)
- [x] `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL` 환경변수 추가 + production 기동 가드
- [x] `notifier.provider.ts`: `RESEND_API_KEY` 유무에 따라 Resend/dev/noop 어댑터 선택
- [x] `auth.module.ts` 에 `FRONTEND_URL` 상수 프로바이더 추가
- [x] `check-secrets.sh` Zod 스키마 오탐(`z.string()`) 제외 패턴 추가

### Phase 컨텍스트
- **Phase**: `phase-17` (멀티테넌시 Foundation + 이메일 어댑터)
- **본 SPEC 의 역할**: phase-17 의 spine spec. spec-17-06(초대 이메일)의 선행 조건이며, production 이메일 발송 경로를 완성한다.

## 🎯 Key Review Points

1. **`createResendNotifier` DI 패턴** (`packages/backend/notification/src/index.ts`): `ResendClient` 인터페이스를 파라미터로 받아 단위 테스트에서 mock 주입 가능. `resend` SDK 는 `apps/api` 의존성으로만 존재.

2. **`notifier.provider.ts` 어댑터 선택 로직**: `RESEND_API_KEY` 설정 시 Resend, 미설정 dev 환경 시 DevNotifier(콘솔), 그 외 NoopNotifier. `loadSettings(process.env)` 직접 호출로 `auth.module.ts` 패턴과 일치.

3. **production 가드 (`settings.ts`)**: `NODE_ENV=production` + `RESEND_API_KEY` 미설정 시 기동 거부. CSRF/OAUTH 가드와 동일 패턴.

## 🧪 Verification

### 자동 테스트
```bash
NODE_OPTIONS="--experimental-strip-types" pnpm --filter ./packages/backend/notification exec vitest run
NODE_OPTIONS="--experimental-strip-types" pnpm --filter ./apps/api exec vitest run --exclude="**/*.e2e.test.ts"
```

**결과 요약**:
- ✅ `@repo/backend-notification`: 9 tests passed
- ✅ `@apps/api` (unit): 68 tests passed

### 수동 검증 시나리오
1. **dev 기동 (RESEND_API_KEY 미설정)**: `NODE_ENV=development` → DevNotifier (콘솔 로그)
2. **prod 기동 (RESEND_API_KEY 설정)**: `NODE_ENV=production RESEND_API_KEY=<your-key>` → ResendNotifier
3. **prod 기동 (RESEND_API_KEY 미설정)**: 에러와 함께 기동 거부 (`RESEND_API_KEY 가 설정되지 않았습니다`)
4. **비밀번호 재설정 이메일**: raw 토큰 대신 `${FRONTEND_URL}/auth/password/reset?token=...` 링크 포함

## 📦 Files Changed

### 🆕 New Files
- `apps/api/src/auth/frontend-url.token.ts`: `FRONTEND_URL` NestJS injection token symbol
- `specs/spec-17-01-email-adapter/task.md`: 작업 체크리스트
- `specs/spec-17-01-email-adapter/walkthrough.md`: 작업 기록

### 🛠 Modified Files
- `packages/backend/notification/src/index.ts` (+62, -1): `ResendClient` 타입, `createResendNotifier`, 3종 이메일 템플릿 추가
- `packages/backend/notification/src/index.test.ts` (+71, -1): 신규 함수 단위 테스트
- `apps/api/src/settings.ts` (+11): `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL` + prod 가드
- `apps/api/src/settings.test.ts` (+33): prod 가드 테스트 5종
- `apps/api/src/notification/notifier.provider.ts` (+15, -7): Resend 어댑터 선택 로직
- `apps/api/src/auth/auth.module.ts` (+5): `FRONTEND_URL` 프로바이더
- `apps/api/src/auth/password-reset.service.ts` (+5, -5): `FRONTEND_URL` 주입, 링크 템플릿 사용
- `apps/api/src/auth/email-verify.service.ts` (+5, -4): 동일
- `apps/api/src/auth/password-reset.service.test.ts` (+2): `FRONTEND_URL` mock
- `apps/api/src/auth/email-verify.service.test.ts` (+2): 동일
- `apps/api/src/auth/password-reset.confirm.service.test.ts` (+2): 동일
- `apps/api/src/auth/email-verify.confirm.service.test.ts` (+2): 동일
- `apps/api/src/auth/secure-token-logging.test.ts` (+4): 동일
- `apps/api/package.json` (+1): `resend ^4.0.0` 의존성
- `.harness-kit/hooks/check-secrets.sh` (+1): Zod 스키마 오탐 제외

**Total**: 15 files changed, +217 -21

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (9 + 68 = 77 tests)
- [x] 통합 테스트 해당 없음 (Integration Test Required = no)
- [x] `walkthrough.md` 작성 완료
- [x] `pr_description.md` 작성 완료
- [x] lint / typecheck 통과 (pre-commit hook)
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-17.md`
- Walkthrough: `specs/spec-17-01-email-adapter/walkthrough.md`
- 관련 ADR: `docs/adr/0022-multi-tenancy-strategy.md`
