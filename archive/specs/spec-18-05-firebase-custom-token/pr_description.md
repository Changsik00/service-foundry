# spec-18-05: Firebase Custom Token 발행 엔드포인트 (브리지 패턴)

## 변경 내용

native 모드(`AUTH_MODE=native`) 서버에서 Firebase 클라이언트 SDK 세션이 추가로 필요한
시나리오를 위한 브리지 엔드포인트 추가.

### 신규 엔드포인트

```
POST /auth/firebase/token
Authorization: Bearer <native-JWT>

200 OK  → { "customToken": "<firebase-custom-token>" }
401     → native JWT 없거나 유효하지 않음
503     → FIREBASE_SERVICE_ACCOUNT 미설정
```

### 브리지 패턴 핵심

- `FIREBASE_SERVICE_ACCOUNT` 설정 시에만 Firebase Admin App 초기화 (`"native-bridge"` 앱 이름)
- `@Optional()` DI — 미설정 시 503 graceful 응답 (앱 시작 실패 없음)
- custom token claims: `{ active_org_id, org_role }` (org 컨텍스트 포함)
- `AUTH_MODE=firebase` 환경에서는 Firebase가 주 인증이므로 이 endpoint 불필요

### 변경 파일

| 파일 | 변경 |
|---|---|
| `apps/api/src/auth/firebase-token.controller.ts` | 신규 — `POST /auth/firebase/token` |
| `apps/api/src/auth/auth.module.ts` | `FirebaseTokenController` + `FIREBASE_ADMIN_APP` 조건부 provider 추가 |
| `apps/api/package.json` | `firebase-admin` 직접 의존성 추가 (타입 해소) |

## 검증

- `pnpm --filter @apps/api test -- firebase-token.controller` → 2/2 PASS
- `pnpm turbo run typecheck` → 48/48 PASS
- `pnpm depcruise` → 위반 없음

## 커밋 목록

- `test(spec-18-05)`: FirebaseTokenController 단위 테스트 + 스텁 (Red)
- `feat(spec-18-05)`: FirebaseTokenController 구현 + AuthModule 배선 (Green)
