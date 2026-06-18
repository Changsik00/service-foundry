# Implementation Plan: spec-15-02

## 📋 Branch Strategy
- 신규 브랜치: `spec-15-02-csrf-wiring` (= spec 디렉토리명)
- 시작 지점: `phase-15-security-wiring` (phase base)
- PR base = `phase-15-security-wiring`

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **CSRF 바인딩 = `csrf_id` 쿠키 (session 아님)**: 미인증 endpoint(session 없음)까지 보호하려면 토큰을 session(refresh token)이 아닌 per-client 랜덤 `csrf_id` 쿠키에 바인딩해야 한다. 대가: csrf.ts 가 광고하는 "session revoke 시 CSRF 자동 무효화" 속성 포기 (double-submit 보안 자체는 cookie↔header 일치로 성립). → ADR 후보 `csrf-binding-strategy`.
> - [ ] **signin/signup 도 CSRF 필요 → 부트스트랩 round-trip**: 보호된 signin 은 사전 발급 토큰이 필요하므로 `GET /auth/csrf` 부트스트랩이 선행돼야 한다(프론트 1회 호출). 로그인 CSRF(forced-login) 방어 목적.

> [!WARNING]
> - [ ] **기존 e2e 영향**: signin/refresh/signout e2e 가 이제 `X-Csrf-Token` 없이는 403. 기존 테스트에 부트스트랩+헤더 추가 필요(회귀 아님, 게이트 강화).
> - [ ] 프론트(web-next) 미동반 시 실제 로그인 UI 가 깨질 수 있음 → 본 spec 에서 web-next 동반(FR6).

## 🎯 핵심 전략 (Core Strategy)

### 아키텍처 컨텍스트
- `issueCsrfToken(secret, id)` / `verifyCsrfToken(secret, id, presented)` 재사용 (보안 로직 신규 작성 금지).
- `id` = `csrf_id` 쿠키 값(랜덤 32B base64url). 컨트롤러의 기존 `sessionId=refreshToken` 패턴과 분리.
- `CsrfGuard` (NestJS `CanActivate`) 가 `csrf_id` 쿠키 + `X-Csrf-Token` 헤더로 검증. `@UseGuards(CsrfGuard)` 를 대상 8개 핸들러(또는 컨트롤러+@Public 제외)에 적용.
- 부트스트랩/rotate 는 cookie helper 확장으로 일원화.

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **검증 위치** | Guard (`CsrfGuard`) | NestJS 관례, 핸들러 단위 granularity, throttler guard 와 순서 제어 용이 |
| **토큰 바인딩** | `csrf_id` 쿠키 (session 아님) | 미인증 endpoint 포함 위해. 대안(session-bound)은 signin/unauth 커버 불가 |
| **부트스트랩** | `GET /auth/csrf` endpoint | safe 메서드에서 쿠키+body 발급. 미들웨어 전역 발급보다 명시적 |
| **rotate** | signin/signup 성공 시 `csrf_id` 재생성 | fixation 방지 |
| **secret** | `CSRF_SECRET` env (settings 스키마) | 기존 `OAUTH_STATE_SECRET` 패턴과 일관 |
| **실패 응답** | 403 Forbidden | CSRF 표준 |
| **프론트 첨부** | web-next auth-api 에서 명시적 헤더 | 인터셉터 신규 도입보다 단순(범위 web-next 한정) |

### 📑 ADR 후보
- [x] 있음 → `csrf-binding-strategy` (type: decision) — 머지 시점 작성 검토.

## 📂 Proposed Changes

### apps/api — 검증/발급
#### [MODIFY] `apps/api/src/settings.ts`
- `CSRF_SECRET: z.string().min(1)` 추가 (+ `.env.example`/테스트 기본값 정합).

#### [NEW] `apps/api/src/auth/csrf.cookie.ts` (또는 cookie.helper.ts 확장)
- `setCsrfCookies(res, secret)`: 새 `csrf_id`(랜덤, httpOnly) 생성 → `csrf_token=issueCsrfToken(secret, csrf_id)`(비-httpOnly) → 둘 다 Set-Cookie. 반환 `csrfToken`(body 동봉용).
- `readCsrfId(req)`: `csrf_id` 쿠키 읽기.

#### [NEW] `apps/api/src/auth/csrf.guard.ts`
- `CsrfGuard implements CanActivate`: `csrf_id` 쿠키 + `X-Csrf-Token` 헤더 → `verifyCsrfToken(secret, csrf_id, header)`; 실패 시 `ForbiddenException`. secret 은 settings DI.

#### [MODIFY] `apps/api/src/auth/auth.controller.ts`
- `GET /auth/csrf` 추가 (부트스트랩, body `{ csrfToken }`).
- 8개 POST 에 `@UseGuards(CsrfGuard)` 적용.
- signin/signup 성공 분기에서 `setCsrfCookies` 로 rotate + 응답 body 에 `csrfToken` 추가.

#### [MODIFY] `apps/api/src/auth/auth.module.ts`
- `CsrfGuard` provider 등록(필요 시). settings 주입 경로 확인.

### web-next — 클라이언트 동반
#### [MODIFY] `apps/web-next/src/lib/auth-api.ts` (+ `auth-sdk.ts`)
- `fetchCsrf()`(GET /auth/csrf)로 토큰 확보·보관. signIn/signUp/signOut/refresh 호출에 `X-Csrf-Token` 헤더 첨부. 응답의 새 `csrfToken` 반영.

### 테스트
#### [MODIFY] `apps/api/src/auth/auth.e2e.test.ts`
- 부트스트랩→헤더 동반 happy path 로 기존 케이스 보정 + CSRF 누락/위조 → 403 케이스 추가.
#### [NEW] `apps/api/src/auth/csrf.guard.test.ts`
- guard 단위: 정상/누락/위조/쿠키부재 분기.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (필수)
```bash
pnpm --filter @apps/api test
pnpm --filter @repo/backend-auth-rate-limit test   # csrf.ts 회귀(불변 확인)
```
### 통합 테스트 (Integration Test Required = yes)
```bash
pnpm --filter @apps/api test   # auth.e2e.test.ts — CSRF 우회 차단(403) + happy path
```
### 게이트 회귀
```bash
pnpm turbo run lint typecheck knip depcruise
```
### 수동 검증 시나리오
1. `GET /auth/csrf` → `csrf_id`+`csrf_token` Set-Cookie + body `csrfToken` — 기대: 200.
2. `POST /auth/refresh` (헤더 정상) → 200 / (헤더 누락·위조) → 403.
3. 미인증 `POST /auth/password/reset` (헤더 누락) → 403.

## 🔁 Rollback Plan
- guard 적용 + secret 추가가 주 → `@UseGuards` 제거 / revert 로 안전 복귀.
- 데이터 변경 없음(쿠키/헤더 검증만). 마이그레이션 없음.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
