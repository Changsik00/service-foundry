# phase-18: 인증 권위 모드 (Auth Authority Mode)

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-18-{seq}-{slug}/spec.md` 에서 다룹니다.
>
> 본 문서는 "이번 phase 에서 무엇을 어디까지 할 것인가" 를 한 번에 보기 위한 *업무 지도* 입니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-18` |
| **상태** | In Progress |
| **시작일** | 2026-06-09 |
| **목표 종료일** | 미정 |
| **소유자** | changsik |
| **Base Branch** | `phase-18-auth-authority-mode` (spec-18-01~ 부터 적용) |

## 🎯 배경 및 목표

### 현재 상황

phase-17에서 멀티테넌시 spine(org·membership·invitation, RLS, provisionUser seam, active_org_id 클레임)이 완성되었다. 그러나 `AuthGuard`는 여전히 native EdDSA JWT만 검증한다. `packages/frontend/auth-firebase`·`auth-supabase` 어댑터로 앱을 구성하면 프론트에서는 provider 세션으로 로그인되지만, 백엔드 API 호출 시 `AuthGuard`가 provider 토큰을 거부한다 — "Firebase/Supabase를 선택한 이유(클라이언트 SDK 의 편리한 세션/토큰 관리)"가 무력화된다.

### 목표 (Goal)

ADR-0023 결정을 구현한다:
1. `AuthGuard`를 **verifier-pluggable** 구조로 전환 — `AccessTokenVerifier` 인터페이스를 DI로 주입.
2. Firebase ID token (JWKS) 검증 백엔드 패키지 제공 + first-request org 프로비저닝 + `setCustomUserClaims` 클레임 주입.
3. Supabase JWT 검증 백엔드 패키지 제공 + 동일 seam + `app_metadata` 클레임 주입.
4. provider 모드 선택 시 native 전용 endpoint(password/oauth/mfa/passkey) 조건부 비활성화.

### 성공 기준 (Success Criteria) — 정량 우선

1. native 모드: 기존 e2e 전체 GREEN (회귀 0)
2. firebase 모드: Firebase ID token으로 보호 API 호출 성공 + 신규 유저 첫 요청 시 org 자동 프로비저닝 확인
3. supabase 모드: Supabase JWT로 보호 API 호출 성공 + 동일 프로비저닝 확인
4. provider 모드에서 native 전용 endpoint(`POST /auth/login` 등) 404 또는 비활성 확인
5. 모든 기존 e2e 테스트 GREEN

## 🧩 작업 단위 (SPEC + phase-FF)

> 본 절은 phase 의 *작업 지도* 입니다. 실질적/불확실 → **SPEC**, 작고 가역적인 1–2 commit → **phase-FF**.
> SPEC 은 요점 + 방향성 + 참조까지만 적습니다. 자세한 spec/plan/task 는 `specs/spec-18-{seq}-{slug}/` 에서 작성합니다.
> sdd 가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신하므로 마커는 그대로 두세요.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-18-01` | verifier-interface | P? | Merged | `specs/spec-18-01-verifier-interface/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-18-01 — verifier-interface

- **요점**: `AccessTokenVerifier` 인터페이스 추출 + `AuthGuard` verifier-pluggable 리팩터
- **방향성**: `packages/nestjs/auth`에 `AccessTokenVerifier` 인터페이스 정의. 기존 `verifyAccessToken` 래핑한 `NativeVerifier` 구현. `AuthGuard`가 DI로 verifier를 주입받도록 변경. 기존 native 동작 불변, breaking change 없음.
- **참조**:
  - `docs/adr/0023-auth-authority-modes.md`
  - `packages/nestjs/auth/src/auth.guard.ts`
- **연관 모듈**: `packages/nestjs/auth/`

### spec-18-02 — firebase-backend-verifier

- **요점**: `packages/nestjs/auth-firebase` 신규 — Firebase ID token 검증 + org 프로비저닝 + custom-claims
- **방향성**: `firebase-admin` SDK 사용. `FirebaseVerifier implements AccessTokenVerifier`. first-request 시 `provisionUser` seam 호출(org 없는 경우). `setCustomUserClaims(uid, { active_org_id, org_role })`로 클레임 주입. `NestjsFirebaseAuthModule.forRoot(...)` 제공.
- **참조**:
  - `docs/adr/0023-auth-authority-modes.md`
  - `apps/api/src/provision/provision.service.ts` (provisionUser seam)
  - `packages/nestjs/auth/` (AccessTokenVerifier 인터페이스 — spec-18-01 선행 필요)
- **연관 모듈**: `packages/nestjs/auth-firebase/` (신규)

### spec-18-03 — supabase-backend-verifier

- **요점**: `packages/nestjs/auth-supabase` 신규 — Supabase JWT 검증 + org 프로비저닝 + claims
- **방향성**: Supabase JWT secret/JWKS 검증. `SupabaseVerifier implements AccessTokenVerifier`. first-request `provisionUser` seam(firebase와 동일 패턴). `app_metadata` 기반 클레임 주입(또는 custom access token hook 가이드). `NestjsSupabaseAuthModule.forRoot(...)` 제공.
- **참조**:
  - `docs/adr/0023-auth-authority-modes.md`
  - `packages/nestjs/auth-firebase/` (spec-18-02 패턴 참조)
  - `packages/nestjs/auth/` (AccessTokenVerifier 인터페이스)
- **연관 모듈**: `packages/nestjs/auth-supabase/` (신규)

### spec-18-04 — provider-mode-cleanup

- **요점**: `AUTH_MODE` env + provider 모드 시 native 전용 모듈 조건부 비활성화 + 생성기 업데이트
- **방향성**: `AUTH_MODE=native|firebase|supabase` 환경변수. `AppModule`에서 모드에 따라 `NativeAuthModule` conditional load. provider 모드에서 password/oauth/mfa/passkey 컨트롤러 비활성화. 생성기(generator)에 `--auth-mode` 옵션 추가해 불필요 패키지 제외.
- **참조**:
  - `docs/adr/0023-auth-authority-modes.md` ("안 쓰면 지운다" 결정)
  - `apps/api/src/app.module.ts`
- **연관 모듈**: `apps/api/src/app.module.ts`, `apps/api/src/settings.ts`, generator

### phase-FF 예정 항목 (spec 미생성)

> 작고 가역적인 1–2 commit 항목. 진행 중 조정 가능.

| 항목 | 요점 | 예상 commit |
|---|---|:---:|
| phase-18.md 메타 보강 | Base Branch 채우기, 소유자 등 | 1 |

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| provider 토큰 처리 | exchange→native JWT / **권위 그대로 신뢰** | 권위 그대로 신뢰 | provider SDK 세션관리 이점 유지 (ADR-0023) |
| AuthGuard 구조 | 조건부 분기 / **verifier DI 주입** | verifier DI | 테스트 가능성, 확장성 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: native 모드 회귀 없음
- **Given**: `AUTH_MODE=native`, 기존 native JWT
- **When**: 보호 API 호출
- **Then**: 기존 e2e 전체 GREEN
- **연관 SPEC**: spec-18-01

### 시나리오 2: Firebase 모드 신규 유저 프로비저닝
- **Given**: `AUTH_MODE=firebase`, Firebase ID token (신규 유저)
- **When**: 보호 API 첫 요청
- **Then**: org 자동 생성 + 멤버십 owner + `active_org_id` 클레임 포함 응답
- **연관 SPEC**: spec-18-02

### 시나리오 3: Supabase 모드 신규 유저 프로비저닝
- **Given**: `AUTH_MODE=supabase`, Supabase JWT (신규 유저)
- **When**: 보호 API 첫 요청
- **Then**: org 자동 생성 + 멤버십 owner + claims 확인
- **연관 SPEC**: spec-18-03

### 시나리오 4: provider 모드 native endpoint 비활성화
- **Given**: `AUTH_MODE=firebase`
- **When**: `POST /auth/login` 호출
- **Then**: 404 또는 명시적 비활성화 응답
- **연관 SPEC**: spec-18-04

## 🔗 의존성

- **선행 phase**: phase-17 (provisionUser seam, org 스키마, active_org_id 클레임)
- **외부 시스템**: Firebase Emulator (spec-18-02 테스트), Supabase local (spec-18-03 테스트)
- **연관 ADR**:
  - `docs/adr/0023-auth-authority-modes.md` (핵심 결정)
  - `docs/adr/0022-multitenant-spine.md` (active org in token 규약)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| Firebase Admin SDK 무거운 의존 | 패키지 사이즈 증가 | `packages/nestjs/auth-firebase` 별도 패키지로 격리 — 미사용 시 미설치 |
| Supabase JWT 검증 방식 (secret vs JWKS) | 검증 전략 복잡도 | spec-18-03에서 두 방식 모두 구현, 환경변수로 선택 |
| provider 모드에서 native endpoint 부분 잔류 | 보안 gap | spec-18-04에서 조건부 모듈 로딩으로 완전 비활성화 |
| org 프로비저닝 중복 실행 | 데이터 정합성 | provisionUser에 idempotent 처리 추가 (org 이미 있으면 skip) |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC 이 Merged (`phase-18-auth-authority-mode` → main)
- [ ] 통합 테스트 전 시나리오 PASS
- [ ] 성공 기준 정량 측정 완료
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
