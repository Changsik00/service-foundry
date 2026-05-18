# phase-08: Provider Adapters — Firebase + Supabase

> 2차안 §Phase 5. `auth-firebase` + `auth-supabase` + `auth-testing`.
> Core Surface 컨벤션의 *실증* — Native JWT(phase-05~07)와 동일 패턴으로 wrap.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-08` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 |

## 🎯 배경 및 목표

### 현재 상황

- phase-05~07 완료 시 *Native JWT* 기반 auth가 완전 동작 (signin/signup/refresh/MFA/Passkey).
- ADR-0006 §"한 앱 한 Provider" + "Consistent Wrapped SDK" 컨벤션의 *실증 단계*.
- 본 phase가 없으면 *컨벤션이 코드로 증명되지 않음* — boilerplate의 핵심 학습 가치.

### 목표 (Goal)

`@repo/auth-firebase` + `@repo/auth-supabase` 각각이 `AuthSDK` Core Surface를 *동일 모양*으로 노출 + Provider 별 강점(Firebase custom claims / Supabase RLS)도 노출. `@repo/auth-testing`은 mock SDK + testing utilities.

### 성공 기준 (Success Criteria) — 정량 우선

1. `@repo/auth-firebase` — `createFirebaseAuthSDK(config)` + AuthSDK Core Surface + `auth.firebase.setCustomClaims` 같은 Provider 강점.
2. `@repo/auth-supabase` — `createSupabaseAuthSDK(config)` + AuthSDK Core Surface + `auth.supabase.rls` 같은 Provider 강점.
3. Error normalize 검증: `firebase auth/user-not-found` → `INVALID_CREDENTIALS` (`@repo/errors` 도메인 코드).
4. `@repo/auth-testing` mock SDK로 auth-react / auth-nestjs 단위 테스트 가능.
5. apps/web-next에서 SDK 교체 (jwt → firebase) 시 *코드 변경 최소* (AuthProvider sdk prop만 교체).

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

### spec-08-01 — auth-firebase

- **요점**: `firebase-admin` (backend) + `firebase` (frontend) wrap. AuthSDK Core Surface 구현 + Error normalize.
- **참조**: ADR-0006 §"Consistent Wrapped SDK".
- **연관 모듈**: `packages/auth-firebase`

### spec-08-02 — auth-supabase

- **요점**: `supabase-js` wrap. AuthSDK Core Surface 구현 + Error normalize.
- **연관 모듈**: `packages/auth-supabase`

### spec-08-03 — auth-testing

- **요점**: Mock AuthSDK + testing utilities (signup/signin/session 시나리오 builder).
- **연관 모듈**: `packages/auth-testing`

### spec-08-04 — sdk-swap-validation

- **요점**: apps/web-next에서 sdk를 jwt → firebase로 교체 + 동작 검증. 코드 변경 *최소* 확인 (AuthProvider prop만).
- **연관 모듈**: apps/web-next

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 패키지 위치 | `packages/auth-{provider}` / `packages/backend/auth-{provider}` | `packages/auth-{provider}` | Provider SDK는 *backend + frontend 양쪽 노출* — 2차안 §전체 구조 |
| Firebase Phone Auth | 본 phase / Icebox | Icebox | SMS 위험 (design note §MFA) + scope 절감 |
| Supabase RLS 통합 | 본 phase / Icebox | 본 phase | `auth.supabase.rls` 강점 노출 — Core Surface와 *직교* |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: Firebase Core Surface 동작

- **Given**: spec-08-01 머지됨 + Firebase project 설정.
- **When**: createFirebaseAuthSDK + signin / refresh / signout.
- **Then**: Native JWT와 *동일 패턴*으로 동작 (AuthResult union 동일).

### 시나리오 2: Error normalize

- **Given**: spec-08-01 머지됨.
- **When**: 존재하지 않는 user로 signin → `auth/user-not-found` 발생.
- **Then**: `@repo/errors` AppError({ code: "INVALID_CREDENTIALS" }) 변환됨 (account enumeration 방지).

### 시나리오 3: SDK swap

- **Given**: spec-08-04 머지됨.
- **When**: apps/web-next의 AuthProvider sdk prop을 jwt → firebase로 교체.
- **Then**: signin/signout UI/hook 코드 *변경 없이* 동작.

## 🔗 의존성

- **선행 phase**: phase-05~07 (Native JWT 완전 동작).
- **외부 시스템**: Firebase project / Supabase project.
- **연관 ADR**: 0006 / 0012
- **연관 design note**: `docs/notes/auth-foundation-architecture.md`

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-08-01 ~ spec-08-04) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인
