# Walkthrough: spec-06-05 — 로그인 수직 슬라이스 통합 테스트

## 실행 결과 요약

```
Test Files  10 passed (10)
     Tests  53 passed (53)
  Duration  1.19s
```

## 변경 파일 목록

| 파일 | 변경 유형 | 설명 |
|---|---|---|
| `pnpm-workspace.yaml` | MODIFY | `cookie-parser ^1.4.7`, `@types/cookie-parser ^1.4.8` catalog 등록 |
| `apps/api/package.json` | MODIFY | `cookie-parser`, `@types/cookie-parser` 의존성 추가 |
| `apps/api/src/main.ts` | MODIFY | `app.use(cookieParser())` 추가 — req.cookies 파싱 활성화 |
| `apps/api/src/auth/auth.e2e.test.ts` | MODIFY | cookieParser beforeAll + 로그인 수직 슬라이스 7개 시나리오 추가 |
| `apps/api/src/auth/signin.service.ts` | BUGFIX | `verifyPassword(plain, hash)` 인자 순서 수정 |
| `apps/api/src/auth/audit.event-listener.ts` | BUGFIX | `import type` → `import` (NestJS DI 런타임 참조 필요) |
| `apps/api/src/app.module.ts` | MODIFY | 불필요한 biome-ignore 주석 제거 |
| `apps/api/src/auth/auth.module.ts` | MODIFY | 불필요한 biome-ignore 주석 제거 |

## 버그 발견 및 수정

### 1. `verifyPassword` 인자 순서 반전 (signin.service.ts)

**증상**: `POST /auth/signin` → 500 `PASSWORD_HASH_MALFORMED`

**원인**: `verifyPassword(plain, hash)` 시그니처인데 `verifyPassword(user.passwordHash, password)`로 호출

**수정**: `verifyPassword(password, user.passwordHash)`

이 버그는 단위 테스트(mock 기반)로는 감지 불가. 통합 테스트가 없었다면 프로덕션까지 살아남았을 버그.

### 2. `AuditEventListener` DI 실패 (audit.event-listener.ts)

**증상**: E2E 테스트 전체 실패 (NestJS DI 오류)

**원인**: `import type { AuditService, AuthEventBus }` → `import type`은 런타임에 지워져 NestJS constructor injection 실패

**수정**: `biome-ignore`와 함께 `import { AuditService, AuthEventBus }` 로 변경

## 통합 테스트 시나리오

```
POST /auth/signup      → 201 + accessToken + Set-Cookie: refresh_token=...
GET  /auth/me          → 200, { user: { sub: userId, role: "user" } }
POST /auth/signout     → 200, { status: "ok" }
POST /auth/refresh     → 401  ← 세션이 실제로 DB에서 취소되었음을 검증
POST /auth/signin      → 200 + 새 accessToken + 새 cookie
POST /auth/refresh     → 200 + 새 accessToken (rotation)
GET  /auth/me          → 200  ← refresh된 토큰으로 인증 확인
```

## cookie-parser 도입 배경

`req.cookies?.refresh_token`은 express의 cookie-parser 미들웨어 없이는 항상 `undefined`.
기존 단위 테스트는 mock 기반이라 쿠키 파싱을 테스트하지 않았음.
실제 cookie 기반 인증 흐름 검증을 위해 `cookie-parser`를 production + test에 모두 추가.
