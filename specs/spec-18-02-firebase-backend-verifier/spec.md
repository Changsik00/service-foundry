# spec-18-02: Firebase 백엔드 verifier

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-18-02` |
| **Phase** | `phase-18` |
| **Branch** | `spec-18-02-firebase-backend-verifier` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no (패키지 단위 — apps/api 통합은 spec-18-04) |
| **작성일** | 2026-06-09 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

spec-18-01에서 `AccessTokenVerifier` 인터페이스와 `NativeVerifier`가 완성되었다. `AuthGuard`는 이제 DI로 주입된 verifier에만 의존한다.

Firebase 모드(ADR-0023)에서는 프론트가 Firebase ID token을 API에 전달한다. 현재 `NativeVerifier`는 native EdDSA JWT만 검증하므로 Firebase ID token을 거부한다.

### 문제점

`@repo/nestjs-auth`에 Firebase ID token을 검증할 verifier가 없다. Firebase 기반 앱을 구성하면 `AuthGuard`가 모든 API 요청을 거부한다.

### 해결 방안 (요약)

`packages/nestjs/auth-firebase/` 신규 패키지에 `FirebaseVerifier implements AccessTokenVerifier`를 구현한다. `firebase-admin` SDK로 ID token을 검증하고, first-request에서 `FIREBASE_PROVISION_PORT`를 통해 org를 프로비저닝한다.

**⚠️ Scope 경계 (중요):**
- `packages/nestjs/auth-firebase/` 패키지 구현 + 단위 테스트 → **이 spec의 완결 범위**
- `users.id`가 `uuid` 타입이므로 Firebase UID(string) 직접 저장 불가 → **spec-18-04에서 DB 마이그레이션 + 실제 배선**
- `apps/api` 배선 없음 (spec-18-04에서 처리)

## 📊 개념도

```
[Firebase Client] → ID token → [AuthGuard]
                                  │ @Inject(ACCESS_TOKEN_VERIFIER)
                                  ▼
                            [FirebaseVerifier]
                             firebase-admin.verifyIdToken(token)
                                  │
                        DecodedIdToken { uid, email, activeOrgId?, role? }
                                  │
                   ┌──────────────┴──────────────────┐
               orgId 있음                       orgId 없음 + port 있음
                   │                                  │
                   ▼                                  ▼
          VerifiedIdentity                  provisionFromProvider(uid, email)
                                                 → setCustomUserClaims(uid, claims)
                                                 → VerifiedIdentity
```

## 🎯 요구사항

### Functional Requirements

1. `FirebaseVerifier implements AccessTokenVerifier`:
   - `firebase-admin/auth`의 `verifyIdToken(token)` 으로 Firebase ID token 검증
   - 검증 실패 → `UnauthorizedException("invalid firebase token")`
   - `decoded.uid` → `VerifiedIdentity.sub`
   - `decoded['activeOrgId']` (ACTIVE_ORG_CLAIM 상수) → `VerifiedIdentity.orgId`, 없으면 `null`
   - `decoded['role']` → `VerifiedIdentity.role`, 없으면 기본값 `"user"`
   - `orgId === null` + `FIREBASE_PROVISION_PORT` 주입된 경우 → `provisionFromProvider(uid, email)` 호출 후 `setCustomUserClaims(uid, { activeOrgId, org_role })`

2. `NestjsFirebaseAuthModule.forRoot(opts: FirebaseAuthOptions)` DynamicModule:
   - Firebase Admin App 초기화 (credential + projectId)
   - `FIREBASE_ADMIN_APP → App` provide
   - `ACCESS_TOKEN_VERIFIER → FirebaseVerifier` provide
   - `FIREBASE_PROVISION_PORT` — optional inject (없으면 provisioning skip)
   - `ACCESS_TOKEN_VERIFIER` export

3. `@repo/nestjs-auth-firebase` public API:
   - `FirebaseVerifier`, `NestjsFirebaseAuthModule`
   - `FIREBASE_PROVISION_PORT` (DI 심볼), `FirebaseProvisionPort` (interface)
   - `FIREBASE_ADMIN_APP` (DI 심볼), `FirebaseAuthOptions` (forRoot 타입)

### Non-Functional Requirements

1. `firebase-admin`을 `dependencies`에 추가 (pnpm catalog 등록)
2. 단위 테스트는 `vi.mock('firebase-admin/auth')` — 실 Firebase 불필요
3. `@repo/nestjs-auth`의 `AccessTokenVerifier`·`ACCESS_TOKEN_VERIFIER`·`VerifiedIdentity` 재사용
4. ADR-0015/0016 준수: `packages/nestjs/auth-firebase/`, `NestjsFirebaseAuthModule` 클래스명

## 🚫 Out of Scope

- `apps/api` 실제 배선 (spec-18-04)
- Firebase UID ↔ internal UUID DB 매핑 / `users` 테이블 스키마 변경 (spec-18-04)
- Firebase Emulator e2e 테스트 (spec-18-04)
- `setCustomUserClaims` 실제 Firebase 호출 e2e 검증 (spec-18-04)
- `org_switch` / org 전환 시 custom claims 갱신 (spec-18-04 또는 후속)

## 📑 ADR 후보

- [ ] 없음 (ADR-0023에 이미 결정됨)

## 🔗 관련 문서

- `docs/adr/0023-auth-authority-modes.md`
- `packages/nestjs/auth/src/verifier.ts` (AccessTokenVerifier 인터페이스)
- `apps/api/src/provision/provision.service.ts` (provisionUser seam)
- `packages/backend/auth-jwt/src/claims.ts` (ACTIVE_ORG_CLAIM = "activeOrgId")

## ✅ Definition of Done

- [ ] `@repo/nestjs-auth-firebase` 패키지 생성 및 빌드 가능
- [ ] `pnpm --filter @repo/nestjs-auth-firebase test` → 전체 PASS
- [ ] `pnpm --filter @repo/nestjs-auth-firebase typecheck` → PASS
- [ ] depcruise 위반 없음
- [ ] walkthrough.md 및 pr_description.md 작성 + ship commit
- [ ] `spec-18-02-firebase-backend-verifier` 브랜치 push + PR to `phase-18-auth-authority-mode`
