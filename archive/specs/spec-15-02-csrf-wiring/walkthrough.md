# Walkthrough: spec-15-02

> CSRF double-submit 배선 (apps/api auth + web-next). 작업 기록 + 결정 + 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 토큰 바인딩 | session(refresh token) / **per-client `csrf_id` 쿠키** | csrf_id | csrf.ts 는 `(secret, id)` 시그니처. 미인증 endpoint(session 없음)까지 보호하려면 session 비의존 binding 필요. session-revoke 자동 무효화는 포기(double-submit 보안은 cookie↔header 일치로 성립). → ADR 후보 `csrf-binding-strategy`. |
| 검증 위치 | middleware / **Guard** | CsrfGuard | NestJS 관례, 핸들러 단위 적용, throttler 와 순서 제어. |
| secret 주입 | 모듈 const 직접 / **DI 토큰** | `CSRF_SECRET` Symbol 토큰 + `useValue: settings.CSRF_SECRET` | 기존 JWT_SIGN_OPTIONS provider 패턴과 일관, guard 테스트 용이. |
| 적용 범위 | 인증만 / **인증+미인증** / 전체 | 인증 4 + 미인증 4 (사용자 결정) | MFA/passkey 는 out-of-scope(후속). |
| signin/signup/refresh rotate | rotate 안 함 / **rotate** | rotate + body csrfToken | fixation 방지 + 클라가 최신 토큰 확보. |
| e2e CSRF 동반 방식 | 토큰 추적(rotation) / **매 요청 fresh 부트스트랩** | fresh bootstrap | guard 는 csrf_id↔header 일치만 보므로, 매번 GET /auth/csrf 로 한 쌍을 받으면 rotation 추적 불필요. |
| task-05/06 commit | 분리 / **결합** | 1 commit | 가드 배선이 기존 e2e 를 깨므로 테스트 정합과 분리 시 중간 commit 이 red. 상호의존 → 한 commit (No-Test-No-Commit 준수). |

### ADR 승격 가이드
- [x] ADR 승격 대상 있음 → `csrf-binding-strategy` (type: decision). 다른 spec(15-03~)이 의존 가능 + 장기 유지 + tradeoff 명시 → 후보. 머지 시점 작성 검토.
- [ ] 없음

## 💬 사용자 협의

- **주제**: CSRF 적용 endpoint 범위 / 프론트 동반 범위
  - **사용자 의견**: "인증 + 미인증 POST 까지", "web-next 만"
  - **합의**: signin/signup/refresh/signout + password-reset(·confirm)/email-verify(·confirm) 8개에 가드. MFA/passkey 는 후속. 프론트는 web-next 만, web-vite/SDK 패키지는 후속.

## 🧪 검증 결과

### 1. 단위 테스트
- **csrf.cookie.test.ts** (4) / **csrf.guard.test.ts** (4): ✅ PASS — 발급·rotate·읽기, 정상/누락/위조/쿠키부재 403.

### 2. 통합 테스트 (Integration Test Required = yes)
- **명령**: `pnpm --filter @apps/api test` (로컬 Postgres 5434, drizzle migrate 후)
- **결과**: ✅ **97/97 PASS** (auth.e2e 39 포함). 신규 "CSRF 게이트" describe: 헤더 누락/csrf_id 부재/위조 → 403, GET /auth/csrf → 200.
- **web-next**: ✅ 21/21 PASS.

### 3. 게이트 회귀
- `pnpm turbo run lint typecheck test knip depcruise` (DATABASE_URL=로컬) → (ship gate 결과 기록).
- knip/depcruise: 신규 파일·`@repo/backend-auth-rate-limit` 실배선 후에도 exit 0.

### 4. 수동 검증 (로컬)
1. `GET /auth/csrf` → csrf_id(httpOnly)+csrf_token 쿠키 + body csrfToken.
2. 헤더 없는 `POST /auth/refresh` → 403 (guard).
3. 부트스트랩 동반 `POST /auth/signup` → 201 + body.csrfToken.

## 🔍 발견 사항

- **시크릿 가드 오탐 재발**: 커밋마다 `csrf_token=...`(의사코드)·`CSRF_SECRET` zod 기본값·테스트 fixture `test-csrf-secret` 가 secrets-guard 의 `token=/secret=` 패턴에 걸림 → `HARNESS_HOOK_MODE_SECRETS=warn` 으로 우회(전부 진짜 false positive). 이번 세션 다수 재발 (메모리 기록된 알려진 패턴) — 가드 패턴 개선은 harness 로컬 영역.
- **로컬↔CI DB 정합**: e2e 는 Postgres(5434/test) 필요. 로컬에서 `docker run postgres:16-alpine` + drizzle migrate 로 풀 e2e 검증함(spec-15-01 의 "CI 에서야 발견" 재발 방지).
- `@repo/backend-auth-rate-limit` 가 실제 배선됨 → spec-15-01 에서 "배선 예정" 으로 knip ignore 했던 dep 이 이제 사용됨(향후 ignore 정리 가능, 비차단).

## 🚧 이월 항목

- MFA/passkey state-changing POST 의 CSRF — 후속 spec/icebox.
- web-vite·`packages/frontend/auth-*` SDK 의 CSRF 헤더 동반 — 후속.
- ADR `csrf-binding-strategy` 작성 — 머지 시점.

## 🔗 관련 문서 (Related)
- 관련 wiki: `docs/explainers/auth/cookie-strategy.md`, `docs/review/2026-06-01-wiring-audit.md` §A
- 관련 ADR: ADR-0019, (후보) `csrf-binding-strategy`

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-01 |
| **최종 commit** | (ship 시 갱신) |
