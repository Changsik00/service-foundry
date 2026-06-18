# spec-18-05: Firebase Custom Token 발행 엔드포인트

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-18-05` |
| **Phase** | `phase-18` |
| **Branch** | `spec-18-05-firebase-custom-token` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-06-09 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

`AUTH_MODE=native`로 운영 중인 서버는 native EdDSA JWT로 인증한다.
`packages/nestjs/auth-firebase`는 Firebase ID token을 검증하는 verifier를 제공하지만,
native 모드에서 Firebase custom token을 발행하는 엔드포인트는 아직 없다.

### 문제점

백엔드는 native JWT 인증을 쓰지만 **프론트에서 Firebase Storage, Realtime DB 등 Firebase 서비스에
직접 접근**해야 하는 경우가 있다. 클라이언트는 Firebase `signInWithCustomToken()`을 위한
custom token이 필요한데 이를 발급받을 방법이 없다.

### 해결 방안 (요약)

`POST /auth/firebase/token` 엔드포인트를 추가한다.
native Bearer 토큰으로 인증한 후 `firebase-admin`의 `createCustomToken(sub, claims)`로
custom token을 발행하여 반환한다. `FIREBASE_SERVICE_ACCOUNT` 미설정 시 503 반환.

## 🎯 요구사항

### Functional Requirements

1. `POST /auth/firebase/token` — `AuthGuard` 보호 (native Bearer JWT)
2. 응답: `{ customToken: string }` (Firebase custom token, 기본 TTL 1시간)
3. custom token claims: `{ active_org_id: user.orgId, org_role: user.role }`
4. `FIREBASE_ADMIN_APP` 미주입(env 미설정) 시 503 반환
5. `AUTH_MODULE=native` 환경에서 `FIREBASE_SERVICE_ACCOUNT` 설정 시 `FIREBASE_ADMIN_APP` 자동 초기화

### Non-Functional Requirements

1. 컨트롤러 상단 주석으로 브리지 패턴 명시: native Bearer가 기본 인증 수단, `AUTH_MODE=firebase`에서는 불필요
2. `@Optional()` 주입 — `FIREBASE_SERVICE_ACCOUNT` 미설정 앱은 503으로 graceful 처리

## 🚫 Out of Scope

- `AUTH_MODE=firebase` / `supabase`에서의 통합 (이미 Firebase 세션 존재)
- 클라이언트 `signInWithCustomToken()` 구현 (프론트 담당)
- custom token 만료 시간 커스터마이징 (Firebase 기본값 1시간)
- 별도 rate-limit (native AuthGuard 이미 적용)
- e2e 테스트 (Firebase Emulator 미구성 환경에서 불안정, 단위 테스트로 커버)

## 📑 ADR 후보

- [ ] 없음 — 브리지 패턴은 기존 `@Optional()` 주입 컨벤션 연장선

## 🔗 관련 문서

- 관련 ADR: `docs/adr/0023-auth-authority-modes.md`
- 관련 Spec: `specs/spec-18-02-firebase-backend-verifier/` (FirebaseVerifier 참조)
- 관련 Spec: `specs/spec-18-04-provider-mode-cleanup/` (AUTH_MODE 설정, ProviderAuthModule)

## ✅ Definition of Done

- [ ] 단위 테스트 3케이스 PASS (정상 발행 / 브리지 미설정 503 / 미인증 401)
- [ ] `pnpm --filter @apps/api test -- firebase-token` → PASS
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] walkthrough.md / pr_description.md 작성 및 ship commit
- [ ] `spec-18-05-firebase-custom-token` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
