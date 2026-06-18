# Implementation Plan: spec-17-02

## 📋 Branch Strategy

- 신규 브랜치: `spec-17-02-multi-tenancy-entity-schema`
- 시작 지점: `phase-17` (base branch)
- **PR 타겟**: `phase-17` (← main 아님)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `organizations.slug` 는 URL-safe 텍스트 (소문자+하이픈). 앱 레이어에서 유효성 검사 예정 (이 spec 에서는 DB unique 제약만).
> - [ ] `memberships.role` enum: `owner | admin | member`. invitation role 은 `admin | member`(owner 초대 불가).

> [!WARNING]
> - [ ] 신규 테이블 추가만 — 기존 테이블 무변경. 기존 마이그레이션·서비스 영향 없음.

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
[apps/api/src/infra/schema/]
  organizations.ts  ← NEW
  memberships.ts    ← NEW
  invitations.ts    ← NEW
  index.ts          ← MODIFY (export + appSchema 등록)
  local.ts          ← MODIFY (drizzle-kit 용 export)

[packages/shared/auth-contracts/src/index.ts] ← MODIFY
  OrgRole, Organization, Membership, InvitationRow 추가

[apps/api/drizzle/]
  0009_*.sql        ← NEW (drizzle-kit generate)
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 스키마 위치 | `apps/api/src/infra/schema/` | 기존 users/sessions 패턴과 동일. 재사용 패키지 아닌 앱-레이어 도메인 테이블. |
| FK 참조 | `references(() => users.id)` | Drizzle FK 정의로 migration SQL 자동 생성 |
| invitation 토큰 저장 | `token_hash` (해시) | password_reset_tokens 와 동일 패턴 — raw 토큰 DB 미저장 (ADR-0014) |
| `OrgRole` contracts 위치 | `@repo/auth-contracts` | 기존 `Role` 가 있는 파일과 동일 패키지, 클라이언트/서버 공유 |

- [x] ADR 없음 (ADR-0022 에서 이미 결정됨)

## 📂 Proposed Changes

### [NEW] `apps/api/src/infra/schema/organizations.ts`

```typescript
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isPersonal: boolean("is_personal").default(false).notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### [NEW] `apps/api/src/infra/schema/memberships.ts`

```typescript
export const orgRoleEnum = pgEnum("org_role", ["owner", "admin", "member"]);

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  role: orgRoleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("memberships_user_org_idx").on(t.userId, t.orgId)]);
```

### [NEW] `apps/api/src/infra/schema/invitations.ts`

```typescript
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  role: inviteRoleEnum("role").notNull(),   // admin | member
  invitedBy: uuid("invited_by").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

> `inviteRoleEnum("invite_role", ["admin", "member"])` — owner 초대 불가.

### [MODIFY] `apps/api/src/infra/schema/index.ts`

- `organizations`, `memberships`, `invitations`, `orgRoleEnum`, `inviteRoleEnum` export
- 관련 Row/Insert 타입 export
- `appSchema` 에 3개 테이블 추가

### [MODIFY] `apps/api/src/infra/schema/local.ts`

- `organizations`, `memberships`, `invitations` export (drizzle-kit 참조용)

### [MODIFY] `packages/shared/auth-contracts/src/index.ts`

```typescript
export const OrgRole = z.enum(["owner", "admin", "member"]);
export const InviteRole = z.enum(["admin", "member"]);

export const Organization = z.object({
  id: Uuid, name: z.string(), slug: z.string(),
  isPersonal: z.boolean(), ownerId: Uuid, createdAt: z.iso.datetime(),
});
export const Membership = z.object({
  id: Uuid, userId: Uuid, orgId: Uuid, role: OrgRole, createdAt: z.iso.datetime(),
});
export const InvitationRow = z.object({
  id: Uuid, orgId: Uuid, email: Email, role: InviteRole,
  invitedBy: Uuid, expiresAt: z.iso.datetime(),
  acceptedAt: z.iso.datetime().nullable(), createdAt: z.iso.datetime(),
});
```

### [GENERATE] `apps/api/drizzle/0009_*.sql`

`pnpm --filter ./apps/api exec drizzle-kit generate` 로 자동 생성.

## 🧪 검증 계획

### 타입체크 (단위 테스트 해당 없음 — 순수 스키마)
```bash
pnpm turbo run typecheck --filter=@repo/auth-contracts --filter=@apps/api
```

### 수동 검증
1. `pnpm --filter ./apps/api exec drizzle-kit generate` → migration SQL 생성 확인
2. migration SQL 에 3개 테이블 CREATE TABLE, FK, UNIQUE 제약 포함 확인

## 🔁 Rollback Plan

- 신규 테이블 추가만이므로 rollback = migration 파일 삭제 + 스키마 파일 삭제
- 기존 테이블 무변경이므로 기존 데이터 영향 없음

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
