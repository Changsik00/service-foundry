# @repo/backend-auth-session

Pure backend session management — Drizzle Session schema + rotation chain + reuse detection (ADR-0013/0014).

## 부트 가이드 (수동 검증)

```bash
# 1. 로컬 PostgreSQL (Docker)
docker run -d --name auth-pg \
  -e POSTGRES_PASSWORD=local \
  -e POSTGRES_DB=service_foundry_dev \
  -p 5432:5432 \
  postgres:16

# 2. migration 실행
DATABASE_URL=postgres://postgres:local@localhost:5432/service_foundry_dev \
  pnpm --filter @repo/backend-auth-session db:migrate

# 3. schema 확인
psql postgres://postgres:local@localhost:5432/service_foundry_dev -c "\d sessions"
```

## API

```ts
import { createSession, rotateSession, revokeSession } from "@repo/backend-auth-session";

// 1. signin → session 생성
const { session, refreshToken } = await createSession(db, { userId });
// → client 에 refreshToken 전달 (cookie 등)

// 2. token rotation
const result = await rotateSession(db, presentedToken);
match(result)
  .with({ type: "rotated" }, ({ refreshToken }) => /* 새 token */)
  .with({ type: "reuse_detected" }, () => /* family 전체 revoke 됨 + alert */)
  .with({ type: "not_found" }, () => /* invalid token */)
  .exhaustive();

// 3. 명시 revoke
await revokeSession(db, sessionId);
```

## 본 패키지 scope 밖

- NestJS adapter → phase-06 (`@repo/nestjs-auth-session`)
- User table → 별 spec (apps/api 가 자체 정의)
- multi-device tracking (userAgent / ipAddress) → 별 spec
- Redis storage / jti deny list → 별 spec
- 자동 expired session cleanup (cron) → 별 spec
- testcontainers integration test → phase-10
