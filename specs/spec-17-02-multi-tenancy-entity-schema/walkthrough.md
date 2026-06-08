# Walkthrough: spec-17-02

## 변경 요약

멀티테넌시 기반 엔티티 3종(`organizations`, `memberships`, `invitations`)을 Drizzle 스키마로 추가하고, `@repo/auth-contracts`에 Zod 계약 타입을 추가했다.

## 주요 결정 사항

### 1. enum을 local.ts에 명시 export

drizzle-kit은 `pgEnum` 객체가 스키마 엔트리 파일(`local.ts`)에서 직접 export되어야 `CREATE TYPE` SQL을 생성한다. 처음에는 테이블만 export했다가 `CREATE TYPE` 누락을 발견, enum도 함께 export하도록 수정했다.

### 2. migration 번호 정렬

재생성 중 journal에 `0009_icy_shape` 고아 엔트리가 생겨 `0010_dry_ben_grimm`으로 채번됐다. journal 수정 + 파일 rename으로 `0009_dry_ben_grimm`으로 정렬했다.

### 3. InvitationRow.tokenHash는 DB에 저장하지 않음

raw 토큰은 DB에 저장하지 않는다(ADR-0014 패턴). `token_hash`만 저장.

## 파일 변경 내역

| 파일 | 변경 |
|---|---|
| `apps/api/src/infra/schema/organizations.ts` | NEW — organizations 테이블 |
| `apps/api/src/infra/schema/memberships.ts` | NEW — memberships 테이블 + orgRoleEnum |
| `apps/api/src/infra/schema/invitations.ts` | NEW — invitations 테이블 + inviteRoleEnum |
| `apps/api/src/infra/schema/index.ts` | MODIFY — 3개 테이블 + Row/Insert 타입 + appSchema 등록 |
| `apps/api/src/infra/schema/local.ts` | MODIFY — 3개 테이블 + enum export |
| `apps/api/drizzle/0009_dry_ben_grimm.sql` | GENERATED — CREATE TYPE + CREATE TABLE + FK + UNIQUE |
| `packages/shared/auth-contracts/src/index.ts` | MODIFY — OrgRole/InviteRole/Organization/Membership/InvitationRow |

## 검증

- `drizzle-kit generate` 성공, SQL에 `CREATE TYPE org_role`, `CREATE TYPE invite_role`, 3개 `CREATE TABLE`, FK 제약, UNIQUE index 포함
- `pnpm turbo run typecheck --filter=@apps/api` PASS
- `pnpm turbo run typecheck lint --filter=@repo/auth-contracts --filter=@apps/api` PASS (경고만, 에러 없음)
