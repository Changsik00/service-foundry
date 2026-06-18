# PR: spec-18-01 — AuthGuard verifier-pluggable 리팩터

## 배경

`AuthGuard`는 `NestjsAuthOptions`(keyStore·issuer·audience)를 직접 주입받아 native JWT 검증을 수행했다.
spec-18-02·03에서 Firebase·Supabase 토큰 검증을 지원하려면 검증 로직을 교체할 수 있어야 한다.

## 변경 사항

### 신규 파일

- `packages/nestjs/auth/src/verifier.ts`
  - `AccessTokenVerifier` 인터페이스 (`verify(token): Promise<VerifiedIdentity>`)
  - `ACCESS_TOKEN_VERIFIER` DI 심볼
  - `NativeVerifier` — 기존 `verifyAccessToken` 로직을 캡슐화

- `packages/nestjs/auth/src/verifier.test.ts` — NativeVerifier 단위 테스트 6개

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `auth.guard.ts` | `@Inject(ACCESS_TOKEN_VERIFIER)`, `verifier.verify()` 위임 |
| `auth.guard.test.ts` | `new AuthGuard(new NativeVerifier(opts))` |
| `module.ts` | `forRoot`·`forRootAsync`에 `ACCESS_TOKEN_VERIFIER` provider 추가 |
| `index.ts` | `AccessTokenVerifier`, `ACCESS_TOKEN_VERIFIER`, `NativeVerifier`, `VerifiedIdentity` export |
| `apps/api/src/auth/auth.module.ts` | `ACCESS_TOKEN_VERIFIER → NativeVerifier` factory provider 추가 |

## 검증

- `@repo/nestjs-auth test` → 18/18 PASS
- `@apps/api test` (단위 전체) → PASS
- biome + typecheck → PASS

## 동작 변경

없음 — 순수 리팩터. native JWT 검증 동작·API·e2e 결과 동일.

## 연관 스펙

- 후속: spec-18-02 (FirebaseVerifier), spec-18-03 (SupabaseVerifier), spec-18-04 (AUTH_MODE cleanup)
- ADR: `docs/adr/0023-auth-authority-modes.md`
