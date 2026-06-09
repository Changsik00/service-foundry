# PR: spec-18-03 — Supabase 백엔드 verifier

## 배경

spec-18-02에서 `@repo/nestjs-auth-firebase`가 완성됐다. Supabase 모드(ADR-0023)에서 프론트가 Supabase JWT를 전달하지만, 현재 `NativeVerifier`·`FirebaseVerifier`만 존재하므로 Supabase JWT를 검증할 수 없다.

## 변경 사항

### 신규 패키지: `packages/nestjs/auth-supabase/` (`@repo/nestjs-auth-supabase`)

| 파일 | 내용 |
|---|---|
| `supabase-provision-port.ts` | `SUPABASE_PROVISION_PORT` 심볼 + `SupabaseProvisionPort` 인터페이스 |
| `supabase-verifier.ts` | `SupabaseVerifier implements AccessTokenVerifier` + `SUPABASE_JWT_OPTIONS` 심볼 |
| `supabase-verifier.test.ts` | 단위 테스트 5개 (실제 HS256 JWT 생성) |
| `supabase-auth.module.ts` | `NestjsSupabaseAuthModule.forRoot(opts)` DynamicModule |
| `index.ts` | public API export |

### catalog 변경 없음

`jose`는 기존 catalog에 등록됨 (`^6.2.0`).

## 검증

- `@repo/nestjs-auth-supabase test` → 5/5 PASS
- biome + typecheck → PASS
- depcruise → 위반 없음

## Firebase 대비 차이점

- 검증: `firebase-admin verifyIdToken` → `jose jwtVerify` (HS256 secret key)
- claims 주입: `setCustomUserClaims` 없음 (Supabase에 해당 API 없음) — DB만 업데이트
- 테스트: `vi.mock` 불필요 — `SignJWT`로 실제 JWT 생성

## Scope

- **이 PR**: 패키지 구현 + 단위 테스트만
- **spec-18-04**: apps/api 배선, `AUTH_MODE` env, 조건부 모듈 로딩

## 연관 스펙

- 선행: spec-18-01 (AccessTokenVerifier 인터페이스), spec-18-02 (FirebaseVerifier)
- 후속: spec-18-04 (apps/api 통합)
- ADR: `docs/adr/0023-auth-authority-modes.md`
