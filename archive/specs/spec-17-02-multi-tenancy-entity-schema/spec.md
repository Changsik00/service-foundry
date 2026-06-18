# spec-17-02: 멀티테넌시 엔티티 스키마

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-17-02` |
| **Phase** | `phase-17` |
| **Branch** | `spec-17-02-multi-tenancy-entity-schema` |
| **Base Branch** | `phase-17` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-06-06 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

모든 도메인 데이터가 단일 테넌트 평면에 있다. `users` 테이블에 전역 `role(user|admin)` 필드가 있고 조직(org) 개념 자체가 없다.

### 문제점

1. **조직 엔티티 부재**: organizations/memberships/invitations 테이블이 없어 spec-17-03(org_id retrofit), spec-17-04(프로비저닝), spec-17-06(초대 endpoint) 진행 불가.
2. **role enum 불일치**: 현재 `role: user|admin` 은 org-role(owner|admin|member) 과 다르다. 이번 spec 에서 DB/contracts 레이어에 새 enum 을 도입하고, 기존 필드 deprecate 는 spec-17-04 에서 처리한다.

### 해결 방안 (요약)

`apps/api/src/infra/schema/` 에 `organizations`, `memberships`, `invitations` 테이블 스키마를 추가하고 Drizzle migration 을 생성한다. `@repo/auth-contracts` 에 `OrgRole` Zod enum 및 조직 관련 계약 타입을 추가한다.

## 📊 개념도

```
organizations
  id (UUID PK), name, slug (UNIQUE), is_personal, owner_id (FK→users), created_at

memberships
  id (UUID PK), user_id (FK→users), org_id (FK→organizations), role, created_at
  UNIQUE (user_id, org_id)

invitations
  id (UUID PK), org_id (FK→organizations), email, token_hash (UNIQUE),
  role, invited_by (FK→users), expires_at, accepted_at (nullable), created_at
```

## 🎯 요구사항

### Functional Requirements

1. `organizations` 테이블: id·name·slug(UNIQUE)·is_personal·owner_id·created_at
2. `memberships` 테이블: id·user_id·org_id·role·created_at / UNIQUE(user_id, org_id)
3. `invitations` 테이블: id·org_id·email·token_hash(UNIQUE)·role·invited_by·expires_at·accepted_at(nullable)·created_at
4. org `role` enum: `owner | admin | member`
5. Drizzle migration 파일 생성 (`drizzle-kit generate`) — SQL diff 검토
6. `appSchema` 에 3개 테이블 등록 (`index.ts`, `local.ts`)
7. `@repo/auth-contracts` 에 `OrgRole`, `Organization`, `Membership`, `InvitationRow` Zod 스키마 추가

### Non-Functional Requirements

1. 기존 테이블·migration 에 변경 없음 (순수 신규 추가)
2. FK 참조 무결성: `user_id → users(id)`, `org_id → organizations(id)`, `invited_by → users(id)`
3. `drizzle-kit generate` 에러 없이 migration SQL 생성

## 🚫 Out of Scope

- `users` 테이블에 `org_id` 컬럼 추가 → spec-17-03
- org 서비스 로직·repository 구현 → spec-17-04~
- 기존 `role` 필드 제거 또는 데이터 마이그레이션 → spec-17-04
- RLS 정책 → spec-17-03
- 초대 endpoint → spec-17-06

## 📑 ADR 후보

- [x] 없음 (ADR-0022 에 이미 테넌시 전략 확정됨)

## 🔗 관련 문서

- `docs/adr/0022-multi-tenancy-strategy.md`
- spec-17-03 (org_id retrofit + RLS — 이 spec 선행 조건)
- spec-17-04 (개인 워크스페이스 프로비저닝 — memberships 사용)
- spec-17-06 (초대 endpoint — invitations 사용)

## ✅ Definition of Done

- [ ] `organizations`, `memberships`, `invitations` 스키마 파일 생성
- [ ] `apps/api/src/infra/schema/index.ts` + `local.ts` 에 신규 테이블 등록
- [ ] `drizzle-kit generate` 성공 (migration SQL 생성됨)
- [ ] `@repo/auth-contracts` 에 `OrgRole` 및 관련 Zod 타입 추가
- [ ] typecheck 통과 (단위 테스트 해당 없음 — 순수 스키마)
- [ ] `walkthrough.md` + `pr_description.md` ship
- [ ] `spec-17-02-multi-tenancy-entity-schema` 브랜치 push, phase-17 타겟 PR 생성
- [ ] 사용자 검토 요청 알림 완료
