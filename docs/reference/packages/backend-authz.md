---
type: reference
aliases: ["@repo/backend-authz", "org 권한 정책"]
tags: [service-foundry, reference, backend, authz]
---

# @repo/backend-authz — org 권한 정책 (authorization)

> 💡 **한 줄 요약**: org 역할(`OrgRole`) 기반 권한 판단 순수 함수 모음 — 인증(authentication)과 분리된 인가(authorization) core.
> **위치**: `packages/backend/authz` · **상위**: [[architecture]]

## 책임 (Responsibility)

org 멤버의 역할(`owner`/`admin`/`member` 등 [[shared-auth-contracts|@repo/auth-contracts]]의 `OrgRole`)을 입력받아 특정 동작 허용 여부를 반환하는 **프레임워크 무관 순수 함수**다. NestJS/HTTP 등 어댑터 레이어가 아니라 backend core 에 위치해 어디서든 재사용된다. 부수효과·I/O 없음.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `canInviteMember` | fn | `(orgRole) => boolean` — `owner` 또는 `admin` 이면 멤버 초대 허용 |
| `canManageOrg` | fn | `(orgRole) => boolean` — `owner` 만 org 관리 허용 |

## 의존

- 내부: [[shared-auth-contracts]] (`@repo/auth-contracts`, `OrgRole` 타입)
- 외부: 없음 (순수 함수, 런타임 dep 0)

## 사용 예

```ts
import { canInviteMember, canManageOrg } from "@repo/backend-authz";

if (!canInviteMember(ctx.orgRole)) throw new ForbiddenError();
```

## 연결된 개념

- [[adr/0022-multi-tenancy-strategy]] — org 스코프 멀티테넌시
- [[adr/0024-tenant-isolation-enforcement]] — RLS 격리(데이터 레벨)와 보완 관계 (authz=동작 레벨)
- [[shared-auth-contracts]] — `OrgRole` 계약

> 소스: `packages/backend/authz/src/index.ts`, `policy.ts`
