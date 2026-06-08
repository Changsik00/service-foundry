# feat(spec-17-02): 멀티테넌시 엔티티 스키마 + contracts

## 개요

`organizations` · `memberships` · `invitations` Drizzle 스키마와 migration을 추가한다. `@repo/auth-contracts`에 `OrgRole`, `Organization`, `Membership`, `InvitationRow` Zod 계약 타입도 함께 추가한다.

이 PR은 spec-17-03(org_id retrofit + RLS) 및 spec-17-04(유저 프로비저닝 seam)의 선행 조건이다.

## 변경 내용

### 신규 스키마 파일

- **organizations**: `id(PK) · name · slug(UNIQUE) · is_personal · owner_id(FK→users) · created_at`
- **memberships**: `id(PK) · user_id(FK→users) · org_id(FK→orgs) · role(org_role enum) · created_at` + `UNIQUE(user_id, org_id)`
- **invitations**: `id(PK) · org_id(FK→orgs) · email · token_hash(UNIQUE) · role(invite_role enum) · invited_by(FK→users) · expires_at · accepted_at(nullable) · created_at`

### PostgreSQL enum 타입

- `org_role`: `owner | admin | member`
- `invite_role`: `admin | member` (owner 초대 불가)

### migration `0009_dry_ben_grimm.sql`

`CREATE TYPE` 2개 + `CREATE TABLE` 3개 + FK 5개 + `UNIQUE INDEX` 1개

### `@repo/auth-contracts` 추가

`OrgRole`, `InviteRole`, `Organization`, `Membership`, `InvitationRow` Zod 스키마 + TypeScript 타입

## 기존 코드 영향

- 기존 테이블 변경 없음 — 순수 신규 추가
- 기존 migration(0000~0008) 변경 없음

## 검증

- [x] `drizzle-kit generate` PASS
- [x] `typecheck` PASS (`@apps/api`, `@repo/auth-contracts`)
- [x] `lint` PASS (경고만, 에러 없음)

## 관련

- ADR-0022: 멀티테넌시 전략
- spec-17-03: org_id retrofit + RLS (이 PR 선행 필요)
- spec-17-06: 초대 endpoint (invitations 테이블 사용)
