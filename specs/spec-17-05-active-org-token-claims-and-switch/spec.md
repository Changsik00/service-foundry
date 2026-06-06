# spec-17-05: active_org 토큰 클레임 + org 전환 endpoint + AsyncLocalStorage 주입

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-17-05` |
| **Phase** | `phase-17` |
| **Branch** | `spec-17-05-active-org-token-claims-and-switch` |
| **Base Branch** | `phase-17` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-06-06 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

spec-17-04에서 `ProvisionService`가 signup 시 personal org + owner membership을 생성하지만, JWT 토큰에는 `active_org_id` / `org_role` 클레임이 없다. 또한 org 전환 endpoint가 없어 멀티 org 멤버는 다른 org로 컨텍스트를 바꿀 수 없다.

spec-17-03의 RLS 정책은 현재 퍼미시브(`IS NULL → 허용`)이므로 데이터 격리가 실제로 적용되지 않는다.

### 문제점

1. JWT에 org 컨텍스트 클레임이 없어 클라이언트/서버 모두 현재 active org를 알 수 없다.
2. `POST /auth/org/switch` endpoint가 없어 멀티 org 멤버가 org를 전환할 수 없다.
3. AsyncLocalStorage + `SET app.current_org` 주입 메커니즘이 없어 RLS strict enforcement 준비가 안 됨.

### 해결 방안

1. JWT 토큰에 `activeOrgId`, `orgRole` 클레임 추가 (signup / org switch 시 발급)
2. `POST /auth/org/switch { orgId }` — 멤버십 검증 후 새 토큰 발급
3. `AsyncLocalStorage`(Tenant ALS) + `withTenantContext()` DB 헬퍼 구현 — strict RLS 전환의 인프라 기반

## 📊 흐름

```
[Signup 이후 — spec-17-05부터]
accessToken claims: { sub, role, activeOrgId, orgRole }

[Org Switch]
POST /auth/org/switch { orgId }
  └─ OrgSwitchService.switch(userId, newOrgId)
       ├─ db: SELECT memberships WHERE userId=? AND orgId=?
       ├─ 없으면 → ForbiddenException
       └─ signAccessToken({ sub, role, activeOrgId:newOrgId, orgRole:membership.role })
            → { accessToken }

[AsyncLocalStorage — 미들웨어 주입]
AuthGuard verifies JWT → req.user = { sub, role, orgId }
TenantContextInterceptor → als.run({ orgId }, next)

[withTenantContext 헬퍼 — DB 격리 예시]
await withTenantContext(db, orgId, async (tx) => {
  await tx.select().from(users).where(...);
  // SET LOCAL app.current_org 자동 적용
});
```

## 🎯 요구사항

### Functional Requirements

1. `ProvisionService.provisionUser()` 리턴: `void` → `{ orgId: string; orgRole: string }`
2. `SignupService.signUp()` — provisionUser 결과를 accessToken 클레임에 포함
3. `AuthGuard` (`@repo/nestjs-auth`) — `req.user`에 `orgId: string | null` 추가
4. `POST /auth/org/switch { orgId }` — 멤버십 조회 후 새 accessToken 발급 (refreshToken 재발급 없음)
5. `TENANT_ALS` — `AsyncLocalStorage<{ orgId: string | null }>` NestJS 프로바이더
6. `TenantContextInterceptor` — `req.user.orgId` → ALS 저장 (전역 등록)
7. `withTenantContext(db, orgId, fn)` — Drizzle 트랜잭션 + `SET LOCAL app.current_org` 헬퍼

### Non-Functional Requirements

1. `@repo/nestjs-auth`의 `AuthenticatedUser` 타입 변경은 backward-compatible (orgId 기본값 null)
2. RLS는 여전히 퍼미시브 — `withTenantContext`는 미래 strict 전환의 기반만 준비
3. org switch는 refreshToken 재발급 없이 accessToken만 발급 (클라이언트 단순화)

## 🚫 Out of Scope

- Strict RLS 활성화 — spec-17-06 이후 (`SET app.current_org` 주입 범위 확대 포함)
- refresh token 재발급 on org switch — 추후 결정
- 초대 endpoint — spec-17-06
- `users.role` 완전 제거 — phase-FF

## 📑 ADR 후보

- [x] 없음 (ADR-0022 §Decision 2, 4에서 이미 확정)

## 🔗 관련 문서

- `docs/adr/0022-multi-tenancy-strategy.md` §Decision 2, 4
- spec-17-03 (permissive RLS — 선행 조건)
- spec-17-04 (ProvisionService — 선행 조건)

## ✅ Definition of Done

- [ ] JWT 클레임에 `activeOrgId`, `orgRole` 포함 (signup 기준 테스트 GREEN)
- [ ] `POST /auth/org/switch` — 멤버십 검증 + 새 토큰 발급 테스트 GREEN
- [ ] `withTenantContext` — 단위 테스트 GREEN
- [ ] `TenantContextInterceptor` — ALS 저장 단위 테스트 GREEN
- [ ] typecheck + lint PASS
- [ ] `walkthrough.md` + `pr_description.md` ship
