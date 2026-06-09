# spec-18-04: Provider 모드 배선 (apps/api 통합)

## 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-18-04` |
| **Phase** | `phase-18` |
| **Branch** | `spec-18-04-provider-mode-cleanup` |
| **상태** | In Progress |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-06-09 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황

spec-18-01~03에서 verifier 패키지 3종 (`NativeVerifier`, `FirebaseVerifier`, `SupabaseVerifier`)이 완성됐다. 그러나 `apps/api`는 여전히 `NativeVerifier`만 하드코딩돼 있고, Firebase/Supabase verifier는 apps/api에 배선되지 않았다.

### 문제점

1. `AUTH_MODE` 환경변수 없음 — Firebase/Supabase 모드 선택 불가
2. Firebase/Supabase 토큰으로 보호 API 호출 시 `NativeVerifier`가 거부
3. `ProvisionService`에 `provisionFromProvider` seam 미구현 — Firebase/Supabase 신규 유저 org 자동 생성 불가
4. Firebase UID는 UUID가 아님 → `users.id`(UUID)에 직접 저장 불가 → `provider_uid` 컬럼 필요
5. provider 모드에서 native 전용 컨트롤러(password/oauth/mfa/passkey)가 노출됨

### 해결 방안 (요약)

`AUTH_MODE=native|firebase|supabase` env 추가. `AppModule`이 모드에 따라 적절한 verifier 모듈을 조건부 로드. `ProvisionService`에 `provisionFromProvider` 구현(Firebase: `provider_uid` 컬럼으로 upsert, Supabase: UUID sub로 직접 upsert). provider 모드에서 `NativeAuthModule`(native 전용 컨트롤러)을 비활성화.

## 요구사항

### Functional Requirements

1. **AUTH_MODE 설정**: `AUTH_MODE=native|firebase|supabase` (기본 `native`)
2. **AppModule 조건부 verifier 모듈 로드**:
   - `native`: 기존 `NestjsAuthModule.forRootAsync()` 유지
   - `firebase`: `NestjsFirebaseAuthModule.forRoot({ serviceAccount, projectId })` + `FIREBASE_PROVISION_PORT → ProvisionService`
   - `supabase`: `NestjsSupabaseAuthModule.forRoot({ jwtSecret })` + `SUPABASE_PROVISION_PORT → ProvisionService`
3. **native 컨트롤러 조건부 비활성화**: `AUTH_MODE=firebase|supabase` 시 `AuthController`, `OAuthController`, `MfaController`, `PasskeyController` 미등록
4. **ProvisionService.provisionFromProvider 구현**:
   - Firebase 모드: `provider_uid` 컬럼으로 upsert → 기존 `provisionUser` seam 호출 → `{ orgId, orgRole, internalUserId }` 반환
   - Supabase 모드: `sub`(UUID)를 `users.id`로 upsert → `provisionUser` 호출 → `{ orgId, orgRole }` 반환
5. **DB 스키마**: `users` 테이블에 `provider_uid TEXT UNIQUE` 컬럼 추가 + 마이그레이션
6. **FirebaseProvisionPort 인터페이스 업데이트**: `internalUserId: string` 반환 추가 → `FirebaseVerifier`가 `sub`를 `internalUserId`로 교체

### Non-Functional Requirements

1. `AUTH_MODE=native` 기본값 — 기존 e2e 테스트 전혀 영향 없음
2. `provider_uid` 컬럼은 nullable + unique — 기존 native 유저 영향 없음
3. `ProvisionService.provisionFromProvider` 단위 테스트: mock DB로 3 케이스

## Out of Scope

- E2E 통합 테스트 (실제 Firebase/Supabase 서비스 필요)
- 생성기(turbo gen) `--auth-mode` 옵션
- Supabase custom access token hook 가이드
- Firebase Emulator 설정

## 설계 결정

| 이슈 | 결정 | 이유 |
|---|---|---|
| Firebase UID → DB 저장 | `provider_uid TEXT UNIQUE` 컬럼 추가 | `users.id`는 UUID — Firebase UID(28자 alnum) 직접 불가 |
| FirebaseVerifier `sub` | `provisionFromProvider` 반환 `internalUserId` 사용 | 하위 시스템이 `req.user.sub`로 DB 조회할 때 UUID 필요 |
| Supabase UID → DB 저장 | `users.id = sub` (Supabase UID는 UUID) | 별도 mapping 불필요 |
| native 컨트롤러 비활성화 | `AppModule`에서 `AuthModule` vs `ProviderAuthModule` 조건부 import | 컨트롤러 등록 자체를 skip — 런타임 조건 분기보다 명확 |

## ADR 후보

- [ ] 없음 — ADR-0023 결정의 구현 (추가 결정 없음)

## 관련 문서

- 관련 ADR: `docs/adr/0023-auth-authority-modes.md`
- 선행: spec-18-01, spec-18-02, spec-18-03

## Definition of Done

- [ ] `ProvisionService.provisionFromProvider` 단위 테스트 PASS
- [ ] typecheck (turbo) PASS
- [ ] biome lint PASS
- [ ] depcruise 위반 없음
- [ ] `walkthrough.md` + `pr_description.md` 작성
- [ ] PR 생성 + 사용자 알림
