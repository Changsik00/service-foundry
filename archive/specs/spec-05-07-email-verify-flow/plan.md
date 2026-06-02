# Plan: spec-05-07 — Email Verify Flow

## 브랜치 전략

- Base: `phase-05-auth-core-security`
- Branch: `spec-05-07-email-verify-flow`
- PR target: `phase-05-auth-core-security`

## 의존 확인

| 의존 항목 | 상태 | 비고 |
|---|---|---|
| `@repo/auth-contracts` (EmailVerifyRequest, EmailVerifyConfirm) | ✅ Merged (spec-05-01) | token: string min(20) |
| `@repo/backend-auth-session` (generateRefreshToken, hashToken) | ✅ Merged (spec-05-02) | SHA-256 hash 패턴 |
| `apps/api` users 테이블 + UserStore | ✅ Merged (spec-05-06) | email_verified 컬럼 포함 |
| `apps/api` AuthController + AuthModule | ✅ Merged (spec-05-06) | 엔드포인트 추가 가능 |

## 핵심 결정

### 1. email_verify_tokens 테이블 (apps/api local)

spec-05-06의 password_reset_tokens와 동일한 구조.

```ts
export const emailVerifyTokens = pgTable("email_verify_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### 2. UserStore 확장

기존 UserStore에 `updateEmailVerified(id: string): Promise<void>` 추가 (password-reset.stores.ts).

### 3. EmailVerifyTokenStore (email-verify.stores.ts)

새 인터페이스 + Drizzle 구현 (insert, findByHash, markUsed).

### 4. EmailVerifyService 로직

```ts
async request(email: string): Promise<void>
  // user 없음 → silent return
  // user.emailVerified = true → silent return (이미 인증됨)
  // token 생성 → SHA-256 hash → DB 저장 (24h TTL) → console.info

async confirm(token: string): Promise<void>
  // hashToken → findByHash
  // 미존재 / 만료 / 재사용 → silent return
  // user 조회: 이미 인증 → silent return
  // updateEmailVerified(row.userId) + markUsed(row.id, now)
```

### 5. AuthModule에 EmailVerifyService 통합

별도 모듈 생성은 오버엔지니어링. EmailVerifyService를 기존 AuthModule의 providers에 추가.

### 6. drizzle migration

`apps/api/drizzle/0001_email_verify_tokens.sql`.

## 파일 변경 목록

| 파일 | 변경 |
|---|---|
| `apps/api/src/infra/schema/email-verify-tokens.ts` | 신규 |
| `apps/api/src/infra/schema/index.ts` | emailVerifyTokens 추가 |
| `apps/api/src/infra/schema/local.ts` | emailVerifyTokens re-export |
| `apps/api/drizzle/0001_email_verify_tokens.sql` | migration |
| `apps/api/src/auth/email-verify.stores.ts` | 신규 (EmailVerifyTokenStore + DI) |
| `apps/api/src/auth/password-reset.stores.ts` | UserStore.updateEmailVerified 추가 |
| `apps/api/src/auth/email-verify.service.ts` | 신규 |
| `apps/api/src/auth/email-verify.service.test.ts` | 신규 |
| `apps/api/src/auth/email-verify.confirm.service.test.ts` | 신규 |
| `apps/api/src/auth/auth.controller.ts` | 2 route 추가 |
| `apps/api/src/auth/auth.module.ts` | EmailVerifyService + stores 추가 |
| `apps/api/src/auth/auth.e2e.test.ts` | email verify E2E 추가 |

## 검증 계획

```bash
# 단위 테스트
pnpm --filter @apps/api exec vitest run

# E2E (real PG — Docker 5434 기동 후)
DATABASE_URL="postgres://postgres:test@localhost:5434/test" \
  pnpm --filter @apps/api exec vitest run src/auth/auth.e2e.test.ts

# typecheck
pnpm typecheck
```

## ADR 후보

- [x] 없음 (spec-05-06 패턴 답습, 신규 결정 없음)

## Deliverables 체크

- [x] spec.md 작성
- [x] plan.md 작성
- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept
- [ ] 모든 task 완료
- [ ] walkthrough.md / pr_description.md ship
