# Implementation Plan: spec-05-02 auth-session

## 📋 Branch Strategy
- 신규 브랜치: `spec-05-02-auth-session` (시작: `phase-05-auth-core-security`)

## 🛑 사용자 검토 (Plan Accept)

> [!IMPORTANT]
> - [x] schema 위치: `@repo/backend-auth-session/src/schema.ts` (도메인 응집)
> - [x] migration: drizzle-kit CLI (startup check 는 별 spec)
> - [x] 테스트: unit (drizzle mock) + 수동 검증
> - [x] Token: `crypto.randomBytes(32).toString("base64url")`
> - [x] Session 필드: id / userId / refreshTokenHash / refreshTokenFamily / createdAt / expiresAt / revokedAt
> - [x] Refresh token: hash 저장 (SHA-256)

> [!WARNING]
> - pure backend — `@repo/nestjs-auth-session` adapter 는 phase-06
> - migration 실행 — 사용자 직접 (README 가이드)

## 🎯 핵심 결정

| 컴포넌트 | 전략 |
|:---:|:---|
| 패키지 위치 | `packages/backend/auth-session/` (ADR-0015) |
| 함수 API | `createSession` / `rotateSession` / `revokeSession` (Repository class 안 박음) |
| token 생성 | `crypto.randomBytes(32).toString("base64url")` (256-bit) |
| token 저장 | SHA-256 hash (Node built-in `crypto.createHash`) |
| rotation chain | `refreshTokenFamily` UUID — reuse 시 family 전체 revoke |
| TTL default | 30 days (`30 * 24 * 60 * 60 * 1000`) |
| test pattern | `vi.mock("@repo/backend-database")` (spec-03-06 답습) |

### Drizzle schema 시안

```ts
// src/schema.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull().unique(),
  refreshTokenFamily: uuid("refresh_token_family").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
```

### 함수 시그니처 시안

```ts
type RotateResult =
  | { type: "rotated"; session: SessionRow; refreshToken: string }
  | { type: "reuse_detected"; revokedCount: number }
  | { type: "not_found" };

export async function createSession(db, { userId, ttlMs? }): Promise<{ session, refreshToken }>;
export async function rotateSession(db, presentedToken): Promise<RotateResult>;
export async function revokeSession(db, sessionId): Promise<void>;
```

## 📂 Proposed Changes

`packages/backend/auth-session/` 신규:
- package.json / tsconfig / vitest.config / drizzle.config / README
- src/{schema.ts, token.ts, session.ts, index.ts}
- src/{token.test.ts, session.test.ts}
- drizzle/ (auto-gen migration)

## 🧪 검증

```bash
pnpm --filter @repo/backend-auth-session test
pnpm --filter @repo/backend-auth-session db:generate
# 수동: 로컬 PG 부트 후 db:migrate
```

## 📦 Deliverables

- [x] task.md 작성
- [ ] Plan Accept
- [ ] 모든 task 완료
- [ ] walkthrough / pr_description ship
