# feat(spec-06-05): 로그인 수직 슬라이스 통합 테스트 + cookie-parser + 버그 수정

## Summary

- **로그인 수직 슬라이스 E2E**: `auth.e2e.test.ts`에 signup → /me → signout → refresh(revoked)→401 → signin → refresh → /me 시나리오 7개 추가
- **cookie-parser 도입**: `app.use(cookieParser())`가 없어 `req.cookies`가 항상 undefined였던 문제 해결 — signout 세션 취소 + refresh 쿠키 읽기 모두 활성화
- **버그 수정 2개**: `verifyPassword` 인자 순서 반전 (signin 500 → 200), `AuditEventListener` import type 오류 (E2E 전체 DI 실패)

## Changed Files

| File | Change |
|---|---|
| `pnpm-workspace.yaml` | cookie-parser catalog 등록 |
| `apps/api/package.json` | cookie-parser 의존성 추가 |
| `apps/api/src/main.ts` | `app.use(cookieParser())` |
| `apps/api/src/auth/auth.e2e.test.ts` | 로그인 수직 슬라이스 7개 시나리오 |
| `apps/api/src/auth/signin.service.ts` | `verifyPassword(plain, hash)` 인자 순서 수정 |
| `apps/api/src/auth/audit.event-listener.ts` | import type → import |

## Bug Details

### verifyPassword 인자 순서 반전
단위 테스트는 mock 기반이라 감지 불가. 통합 테스트 작성 중 발견.
```ts
// Before (wrong)
const valid = await verifyPassword(user.passwordHash, password);
// After (correct)
const valid = await verifyPassword(password, user.passwordHash);
```

### AuditEventListener DI 실패
```ts
// Before
import type { AuditService, AuthEventBus } from "@repo/backend-auth-audit";
// After
// biome-ignore lint/style/useImportType: NestJS emitDecoratorMetadata requires runtime reference
import { AuditService, AuthEventBus } from "@repo/backend-auth-audit";
```

## Test Results

```
Test Files  10 passed (10)
     Tests  53 passed (53)
```

## Test plan

- [ ] `docker run -d --name sf-test-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test -p 5434:5432 postgres:16-alpine` 실행
- [ ] `DATABASE_URL="postgres://postgres:test@localhost:5434/test" pnpm --filter @apps/api db:migrate`
- [ ] `DATABASE_URL="postgres://postgres:test@localhost:5434/test" HTTP_CLIENT_BASE_URL="http://localhost:9999" pnpm --filter @apps/api test`
- [ ] 53/53 PASS 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
