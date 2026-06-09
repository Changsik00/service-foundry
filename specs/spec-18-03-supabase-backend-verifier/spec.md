# spec-18-03: Supabase 백엔드 verifier

## 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-18-03` |
| **Phase** | `phase-18` |
| **Branch** | `spec-18-03-supabase-backend-verifier` |
| **상태** | In Progress |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-06-09 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황

spec-18-02에서 `@repo/nestjs-auth-firebase` 패키지가 완성됐다. `AccessTokenVerifier` 인터페이스를 통해 Firebase ID token을 검증하는 패턴이 확립됐다.

### 문제점

Supabase 모드를 선택한 앱에서 `AuthGuard`가 Supabase JWT를 검증할 수 없다. `@repo/nestjs-auth-firebase`와 동일한 구조로 Supabase JWT를 처리하는 백엔드 패키지가 없다.

### 해결 방안 (요약)

`packages/nestjs/auth-supabase/` 신규 패키지에 `SupabaseVerifier implements AccessTokenVerifier`를 구현한다. Supabase JWT는 HS256으로 서명되므로 `jose` `jwtVerify`로 직접 검증한다. `@supabase/supabase-js` 의존 없이 경량 구현.

## 요구사항

### Functional Requirements

1. **JWT 검증**: `jwtVerify(token, new TextEncoder().encode(jwtSecret))` — 실패 시 `UnauthorizedException("invalid supabase token")`
2. **클레임 추출**:
   - `payload.sub` → `VerifiedIdentity.sub`
   - `payload.role` (Supabase default `"authenticated"`) → `role`. 없으면 `"user"` 기본값
   - `payload[ACTIVE_ORG_CLAIM]` 우선, fallback `(payload.app_metadata as Record)?.[ACTIVE_ORG_CLAIM]` → `orgId | null`
3. **First-request 프로비저닝**: `orgId === null` && `SUPABASE_PROVISION_PORT` 주입된 경우 `provision.provisionFromProvider(sub, email)` 호출
4. **NestjsSupabaseAuthModule.forRoot(opts)**: `opts.jwtSecret` 필수, `ACCESS_TOKEN_VERIFIER → SupabaseVerifier` provide·export

### Non-Functional Requirements

1. `@supabase/supabase-js` 의존 없음 — `jose`만으로 JWT 검증
2. 단위 테스트 5개: 실제 HS256 서명된 테스트 JWT 사용 (`vi.mock('jose')` 불필요)
3. depcruise 위반 없음
4. biome lint + typecheck PASS

## Out of Scope

- Supabase custom access token hook 구현 (앱 레벨 가이드 — spec-18-04)
- apps/api 배선 (spec-18-04)
- issuer/audience 검증 (선택적 — `opts.issuer` 파라미터로 향후 확장 가능)

## 설계 결정

| 이슈 | 결정 | 이유 |
|---|---|---|
| JWT 검증 방식 | jose `jwtVerify` (HS256) | HTTP 콜 불필요, 빠름. `@supabase/supabase-js` 서버 사이드 의존 제거 |
| custom claims 주입 | 없음 (DB만 업데이트) | Supabase custom claims는 custom access token hook 필요 — spec-18-04 가이드 |
| orgId 위치 | `payload[ACTIVE_ORG_CLAIM]` 우선, fallback `payload.app_metadata?.[ACTIVE_ORG_CLAIM]` | custom access token hook 있으면 top-level, 없으면 app_metadata |

## ADR 후보

- [ ] 없음 — spec-18-02와 동일 패턴, 추가 ADR 불필요

## 관련 문서

- 관련 ADR: `docs/adr/0023-auth-authority-modes.md`
- 선행 spec: spec-18-01 (AccessTokenVerifier 인터페이스), spec-18-02 (FirebaseVerifier 패턴)

## Definition of Done

- [ ] 모든 단위 테스트 PASS (5개)
- [ ] biome lint + typecheck PASS
- [ ] depcruise 위반 없음
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-18-03-supabase-backend-verifier` 브랜치 push + PR 생성
- [ ] 사용자 검토 요청 알림 완료
