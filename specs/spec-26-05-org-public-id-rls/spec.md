# spec-26-05: organizations.public_id + RLS 정합

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-26-05` |
| **Phase** | `phase-26` |
| **Branch** | `spec-26-05-org-public-id-rls` |
| **Base 브랜치** | `phase-26-id-scheme-public-id` |
| **상태** | Planning |
| **타입** | Feature (schema/API 계약 / 노출 전환) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

users 는 public_id 도입·노출 완료(26-02/03). 그러나 **org 식별자는 여전히 내부 uuid 로 노출**된다: `/auth/orgs`·`/auth/org/members`·`/auth/me`(orgId)·provider-org 응답·`/admin/*`. 또 `POST /auth/org/switch` 는 내부 org uuid 를 입력으로 받는다(`org.controller.ts:54`). org id 가 JWT `active_org`·`SET LOCAL app.current_org`·RLS 술어의 **단일 출처(내부 uuid)** 라는 점이 제약.

### 문제점

- org 내부 uuid 가 응답·콘솔 표면에 노출(ADR-0028 불변식 미충족, users 만 완료).
- switch 입력이 내부 uuid 라 클라가 내부 식별자를 다뤄야 함.
- **org/members 의 `userId` 도 내부 user uuid 노출**(member table) — user public_id 상속 필요.

### 해결 방안

`organizations.public_id`(text UK, `gen_public_id('org')` default) 도입(users 패턴). **JWT `active_org`·`SET LOCAL app.current_org`·RLS 는 내부 uuid 유지**(SoT 불변). 외부 표면만 변환: ① 응답 org 식별자 → org public_id ② switch 입력 → public_id 수용 후 **내부 id 해석 + 멤버십 검증**(ADR-0029) ③ org/members 의 userId → user public_id 상속. 격리·동작 회귀 0.

## 요구사항

1. **`organizations.public_id`**: `text NOT NULL UNIQUE DEFAULT gen_public_id('org')` + 백필 마이그레이션(VOLATILE default, users 패턴).
2. **응답 노출 전환** (orgId/id → org public_id): `/auth/orgs`(orgId), `/auth/org/members`(orgId), `/auth/me`(orgId), provider-org switch/invite-accept(orgId), `/admin/orgs`(id·ownerId), `/admin/users`(orgId).
3. **org/members userId → user public_id** 상속(member table 내부 user uuid 노출 제거).
4. **switch 입력 = public_id**: `OrgSwitchInput.orgId` = org public_id → switch 서비스가 **public→내부 org id 해석 + 멤버십 검증**(없거나 비멤버면 403, ADR-0029 불변식). native+provider 양쪽.
5. **내부 불변 유지**: JWT `active_org`·`SET LOCAL app.current_org`·RLS 술어·memberships/sessions/invitations FK 는 내부 uuid 그대로. RLS 동작 무변경.
6. **web 반영**: org queries 스키마·TenantSwitcher(현재 org 비교)·member table·admin queries 가 public_id 사용.
7. **회귀 0 + 격리 보존**: tenant-isolation e2e 포함 전체 PASS.

## Out of Scope

- 나머지 root(api-keys·sessions) 식별자 → 26-06
- 누출 감사 스냅샷(전 응답 내부 uuid 0) → 26-07
- RLS NULL-permissive flip (Icebox)
- admin cursor 의 내부 id 기반 인코딩 → 불투명 base64 라 외부 의미 없음; 본 spec 은 admin **가시 필드**만 전환(cursor 는 26-07 점검 대상으로 이월 가능)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **switch 입력 = org public_id (해석+멤버십 검증)** — 내부 uuid 를 클라에서 제거. ADR-0029 대로 비멤버/미존재 403.
> - [ ] **admin cursor 는 내부 id 유지(불투명 base64)** — 26-05 는 admin 가시 필드만 public_id. cursor 의 내부 uuid 포함은 26-07 누출 점검에서 결정. 동의?

> [!WARNING]
> - [ ] **Breaking**: org 식별자 값 uuid→`org_…`. switch 입력 계약 변경 → web 동시 수정. JWT active_org 는 내부 유지(클라가 직접 안 봄).

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| org 식별자(응답) | organizations 조인 → public_id | 외부=public_id |
| JWT active_org / SET LOCAL / RLS | **내부 uuid 유지** | RLS SoT, 격리 불변 |
| switch 입력 | public_id → 내부 해석 + 멤버십 검증 | ADR-0029, 클라 내부 uuid 제거 |
| org/members userId | user public_id 조인 | 내부 user uuid 상속 제거 |

## Proposed Changes

#### [NEW] `apps/api/drizzle/00XX_org_public_id.sql`
- `organizations.public_id` ADD COLUMN DEFAULT gen_public_id('org') NOT NULL(VOLATILE 백필) + UNIQUE. journal/snapshot 정합.

#### [MODIFY] `packages/backend/schema/src/organizations.ts`
- `publicId: text("public_id").notNull().unique().default(sql\`gen_public_id('org')\`)`

#### [MODIFY] org 응답 서비스/컨트롤러
- `org-list.service.ts`(이미 organizations 조인 — `publicId` 추가), `org-members.service.ts`(organizations·users 조인 → org/user public_id), `auth.controller.ts`/`provider-me.controller.ts`(/me orgId→org public_id), `provider-org.controller.ts`(switch/accept 응답), `admin.service.ts`(id·ownerId·orgId).

#### [MODIFY] switch 입력 해석
- `OrgSwitchInput`(auth-contracts): orgId = public_id 형식. `org-switch.service.ts`/`provider-org-switch.service.ts`: public→내부 해석 + 멤버십 검증.

#### [MODIFY] web
- `features/orgs/*`(queries·mutations·TenantSwitcher), `features/admin/*`, member table.

## 검증 계획

```bash
turbo run lint typecheck test   # fresh 5434 DB
```
수동/통합 시나리오:
1. signup → `/auth/orgs` orgId = `^org_…`(uuid 아님) — PASS
2. switch(public_id) → 200; switch(타 org public_id, 비멤버) → 403; switch(미존재 public_id) → 403 — PASS
3. tenant-isolation e2e(RLS, 내부 id 기반) 회귀 0 — PASS
4. `/auth/org/members` 의 userId = user public_id — PASS

## 롤백 계획

- `git revert` + 컬럼 추가는 가역적. RLS/JWT 무변경이라 격리 영향 없음.

## ADR 후보

- [x] ADR-0028 §5(org RLS 정합) 이미 결정 — 시행. 추가 ADR 불요.

## ✅ Definition of Done

- [ ] organizations.public_id + 백필, RLS/JWT 내부 uuid 불변
- [ ] org 응답 식별자 + org/members userId → public_id, switch 입력 public_id 해석+멤버십 검증
- [ ] web 반영, tenant-isolation 회귀 0
- [ ] walkthrough/pr_description + push
