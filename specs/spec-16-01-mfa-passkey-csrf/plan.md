# Implementation Plan: spec-16-01

## 📋 Branch Strategy
- 신규 브랜치: `spec-16-01-mfa-passkey-csrf`
- 시작 지점: `phase-16-security-hardening` (phase base)
- PR base = `phase-16-security-hardening`

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **8개 전수 적용** (options 포함). challenge 발급(`*/options`)도 서버 상태(challenge 저장)를 남기므로 보수적으로 CSRF 보호. 빼고 싶으면 알려주세요.
> - [ ] **가드 스택 순서** `@UseGuards(AuthGuard, CsrfGuard)` — AuthGuard 먼저(미인증 401) 후 CsrfGuard(403). 기존 auth.controller 패턴과 정합.

> [!WARNING]
> - [ ] 기존 MFA/passkey e2e 슬라이스(`auth.e2e.test.ts`)가 csrf 없이 호출 중 → CsrfGuard 배선 시 403 으로 깨짐. **같은 commit 에서 `postCsrf` 동반으로 갱신**(No-Test-No-Commit, spec-15-02 결합 선례).

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| CSRF 메커니즘 | 기존 `CsrfGuard` 재사용 | ADR-0021 csrf_id, session 비의존 → 미인증 endpoint 도 커버 |
| 가드 스택 | AuthGuard 있는 곳 `(AuthGuard, CsrfGuard)`, 없는 곳 `(CsrfGuard)` | 인증+CSRF 직교, 기존 401 동작 보존 |
| e2e 갱신 | 배선과 동일 commit | 가드가 기존 슬라이스를 깨므로 분리 시 중간 red (spec-15-02 결합 선례) |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes

#### [MODIFY] `apps/api/src/auth/mfa.controller.ts`
- 4개 `@Post` 에 `CsrfGuard` 추가. enroll/enroll·confirm/disable → `@UseGuards(AuthGuard, CsrfGuard)`; verify → `@UseGuards(CsrfGuard)`.
- `CsrfGuard` import 추가.

#### [MODIFY] `apps/api/src/auth/passkey.controller.ts`
- 4개 `@Post` 에 `CsrfGuard` 추가. register/options·register/verify → `(AuthGuard, CsrfGuard)`; authenticate/options·authenticate/verify → `(CsrfGuard)`.

#### [MODIFY] `apps/api/src/auth/auth.e2e.test.ts`
- 신규 describe "MFA/passkey CSRF 게이트": csrf 헤더 누락 `POST /auth/mfa/totp/verify` → 403, `passkey/authenticate/verify` → 403.
- 기존 "MFA TOTP 수직 슬라이스"·"Passkey 수직 슬라이스" 의 `request(server).post(...)` 호출을 `postCsrf(...)` 동반으로 갱신(Bearer 유지) → 회귀 GREEN.

## 🧪 검증 계획 (Verification Plan)

### 통합 테스트 (필수, Integration Test Required = yes)
```bash
DATABASE_URL=postgres://postgres:test@localhost:5434/test pnpm --filter @apps/api test
```
- 신규 CSRF 게이트 e2e PASS + 기존 MFA/passkey 슬라이스 csrf 동반 GREEN.

### 수동 검증 시나리오
1. csrf 없이 `POST /auth/mfa/totp/verify` — 기대: 403.
2. `GET /auth/csrf` → csrf_id+token 동반 verify — 기대: 기존대로 동작.

### 게이트
```bash
pnpm turbo run lint typecheck knip depcruise
```

## 🔁 Rollback Plan
- 가드 데코레이터 추가 한정 → 제거로 revert 안전. 비즈니스 로직 무변경.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
