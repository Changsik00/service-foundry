# PR: spec-18-02 — Firebase 백엔드 verifier

## 배경

spec-18-01에서 `AccessTokenVerifier` 인터페이스가 완성되었다. Firebase 모드(ADR-0023)에서 프론트가 Firebase ID token을 전달하지만, 현재 `NativeVerifier`만 존재하므로 Firebase token을 검증할 수 없다.

## 변경 사항

### 신규 패키지: `packages/nestjs/auth-firebase/` (`@repo/nestjs-auth-firebase`)

| 파일 | 내용 |
|---|---|
| `firebase-provision-port.ts` | `FIREBASE_PROVISION_PORT` 심볼 + `FirebaseProvisionPort` 인터페이스 |
| `firebase-verifier.ts` | `FirebaseVerifier implements AccessTokenVerifier` + `FIREBASE_ADMIN_APP` 심볼 |
| `firebase-verifier.test.ts` | 단위 테스트 5개 (`vi.mock('firebase-admin/auth')`) |
| `firebase-auth.module.ts` | `NestjsFirebaseAuthModule.forRoot(opts)` DynamicModule |
| `index.ts` | public API export |

### catalog 추가

- `pnpm-workspace.yaml`: `firebase-admin: "^13.0.0"` 추가

## 검증

- `@repo/nestjs-auth-firebase test` → 5/5 PASS
- biome + typecheck → PASS
- depcruise → 위반 없음

## Scope

- **이 PR**: 패키지 구현 + 단위 테스트만
- **spec-18-04**: apps/api 배선, DB 마이그레이션 (Firebase UID ↔ internal UUID), AUTH_MODE 조건부 로딩

## 연관 스펙

- 선행: spec-18-01 (AccessTokenVerifier 인터페이스)
- 후속: spec-18-03 (SupabaseVerifier), spec-18-04 (apps/api 통합)
- ADR: `docs/adr/0023-auth-authority-modes.md`
