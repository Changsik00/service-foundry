# Implementation Plan: spec-05-06

## 📋 Branch Strategy

- 신규 브랜치: `spec-05-06-password-reset-flow`
- 시작 지점: `phase-05-auth-core-security` (phase base branch)
- Task 1이 브랜치 생성 수행 (commit 없음)

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] `users` 테이블을 apps/api 로컬에 정의 (공유 패키지 아님). 향후 apps/api가 성장하면 별도 패키지로 이동 가능.
> - [ ] apps/api가 처음으로 자체 Drizzle schema와 migration을 가짐 — 기존 패키지(auth-session, auth-rate-limit)와 별도 마이그레이션으로 분리 유지.
> - [ ] Rate limit: request endpoint에만 per-IP 적용. confirm에는 적용 안 함 (token 1회성으로 충분).
> - [ ] JWKS keystore: `createInMemoryKeyStore()` — 앱 재시작 시 키 교체. 영속화는 phase-10.

> [!WARNING]
> - [ ] email 발송은 `console.log` stub — 실 이메일 전송 없음. token은 log에서만 확인.
> - [ ] 전체 배포 시 3번 마이그레이션 실행 필요: auth-session → auth-rate-limit → apps/api 순서.

## 🎯 핵심 전략 (Core Strategy)

### 아키텍처 컨텍스트

```
apps/api/
  src/
    infra/schema/
      users.ts                ← NEW: users 테이블 (Drizzle)
      password-reset-tokens.ts← NEW: password_reset_tokens 테이블
      index.ts                ← NEW: all schema re-export
    jwt/
      jwt.service.ts          ← NEW: createInMemoryKeyStore + toJwks 래퍼
      jwks.controller.ts      ← NEW: GET /.well-known/jwks.json
      jwt.module.ts           ← NEW: NestJS DI 모듈
    auth/
      password-reset.service.ts   ← NEW: request() + confirm() 비즈니스 로직
      password-reset.service.test.ts ← NEW: 단위 테스트 (fake DB)
      auth.controller.ts          ← NEW: POST /auth/password/reset + /confirm
      auth.e2e.test.ts            ← NEW: E2E 테스트 (real PG)
      auth.module.ts              ← NEW: AuthModule
    app.module.ts             ← MODIFY: JwtModule + AuthModule 추가, schema 업데이트
  drizzle.config.ts           ← NEW: drizzle-kit config (local schema만)
  drizzle/                    ← NEW: migration SQL (drizzle-kit generate)
  package.json                ← MODIFY: db:generate + db:migrate 스크립트 추가
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **users 테이블** | apps/api 로컬 Drizzle schema | 공유 패키지 불필요 — apps/api 고유 도메인 |
| **token 저장** | SHA-256 hash (auth-session `hashToken` 재사용) | ADR-0014: DB에 raw token 미저장 |
| **email 발송** | `console.log` stub | mailer spec은 별도 — 본 spec은 flow 검증 |
| **rate limit** | per-IP, request endpoint 한정 | confirm은 token 1회성으로 자연 rate limit |
| **JWKS keystore** | `createInMemoryKeyStore()` | 영속화 전 endpoint 마운트 우선 |
| **Zod validation** | inline `zodPipe(schema)` helper | nestjs-zod 미설치 — auth-contracts schema 직접 재활용 |
| **apps/api DB schema** | 로컬 schema + 패키지 schema 합산 import | DatabaseModule.forRoot에 전체 schema 주입 |

### 📑 ADR 후보

- [x] 없음 (기존 ADR-0013 / ADR-0014 패턴 답습)

## 📂 Proposed Changes

### [apps/api — DB Schema]

#### [NEW] `apps/api/src/infra/schema/users.ts`
```ts
// users 테이블: auth의 주체
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### [NEW] `apps/api/src/infra/schema/password-reset-tokens.ts`
```ts
// password_reset_tokens: 15분 TTL, 단일 사용
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### [NEW] `apps/api/src/infra/schema/index.ts`
- `users`, `passwordResetTokens` re-export
- auth-session의 `sessions`, auth-rate-limit의 `failedLogins` / `lockouts` re-export
- DatabaseModule.forRoot에 사용할 unified schema

#### [NEW] `apps/api/drizzle.config.ts`
- `schema: "./src/infra/schema/index.ts"`, `out: "./drizzle"`, `dialect: "postgresql"`

#### [MODIFY] `apps/api/package.json`
- `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"` 추가
- devDependencies: `drizzle-kit` 추가

### [apps/api — JWT 모듈]

#### [NEW] `apps/api/src/jwt/jwt.service.ts`
- `JwtService`: 앱 시작 시 `createInMemoryKeyStore()` 생성, `getJwks()` 제공

#### [NEW] `apps/api/src/jwt/jwks.controller.ts`
- `GET /.well-known/jwks.json` — `@SkipThrottle()`, JwtService.getJwks() 반환

#### [NEW] `apps/api/src/jwt/jwt.module.ts`
- providers: [JwtService], controllers: [JwksController], exports: [JwtService]

### [apps/api — Auth 모듈]

#### [NEW] `apps/api/src/auth/password-reset.service.ts`
- `PasswordResetService`: `DATABASE` 주입 + `checkRateLimit` + `findUserByEmail` + `createResetToken` + `confirmReset`
- `zodPipe(schema)` helper (파일 상단 또는 shared 위치)

#### [NEW] `apps/api/src/auth/password-reset.service.test.ts`
- 단위 테스트: fake DB(Map) 사용, 서비스 로직 직접 검증
- 케이스: 존재 email → token 생성, 미존재 email → 생성 없음, confirm 성공, confirm 만료, confirm 재사용

#### [NEW] `apps/api/src/auth/auth.controller.ts`
- `POST /auth/password/reset` + `POST /auth/password/reset/confirm`
- 응답: `{ status: 'ok' }` (항상 200)

#### [NEW] `apps/api/src/auth/auth.e2e.test.ts`
- real PG (Docker) 기반 E2E: request → DB 확인 → confirm → password 갱신 확인

#### [NEW] `apps/api/src/auth/auth.module.ts`
- imports: [DatabaseModule? — via forwardRef or global], providers: [PasswordResetService], controllers: [AuthController]

#### [MODIFY] `apps/api/src/app.module.ts`
- `DatabaseModule.forRoot({ schema: appSchema })` — unified schema
- `imports` 에 `JwtModule`, `AuthModule` 추가

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (필수)
```bash
pnpm --filter @apps/api test
```
- `password-reset.service.test.ts`: 5+ 케이스 (request 존재/미존재/rate-limited, confirm 성공/만료/재사용)

### 통합 테스트 (real PG)
```bash
docker run -d --name api-pg \
  -e POSTGRES_PASSWORD=local -e POSTGRES_DB=service_foundry_dev \
  -p 5434:5432 postgres:16

# auth-session / auth-rate-limit migration (선행)
DATABASE_URL=postgres://postgres:local@localhost:5434/service_foundry_dev \
  pnpm --filter @repo/backend-auth-session db:migrate
DATABASE_URL=postgres://postgres:local@localhost:5434/service_foundry_dev \
  pnpm --filter @repo/backend-auth-rate-limit db:migrate

# apps/api local migration
DATABASE_URL=postgres://postgres:local@localhost:5434/service_foundry_dev \
  pnpm --filter @apps/api db:migrate

# E2E 테스트
DATABASE_URL=postgres://postgres:local@localhost:5434/service_foundry_dev \
  pnpm --filter @apps/api test
```

### 수동 검증 시나리오
1. seed user 삽입 → `POST /auth/password/reset` 호출 → 응답 200 + DB에 token_hash 확인
2. 미존재 email로 동일 호출 → 응답 200 + DB에 token 없음 (enumeration-safe)
3. 만료 token으로 confirm → 응답 200 (silent fail)
4. 유효 token으로 confirm → 응답 200 + users.password_hash 갱신 확인
5. `GET /.well-known/jwks.json` → JWKS JSON 반환 확인

## 🔁 Rollback Plan

- 브랜치 drop으로 충분 — main에 영향 없음.
- Docker container 삭제: `docker stop api-pg && docker rm api-pg`.

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
