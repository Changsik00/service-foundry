# spec-x-native-list-orgs: native 모드 `GET /auth/orgs` 추가 (모드 parity)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-native-list-orgs` |
| **Branch** | `spec-x-native-list-orgs` |
| **Base 브랜치** | `main` |
| **타입** | Fix (모드 parity) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

"내 org 목록"(테넌트 스위처 데이터)은 **provider 모드에만** 있다 — `ProviderOrgController.orgs` → `OrgListService.listForProviderUid(user.sub)`(=`WHERE users.providerUid`). **native 모드 `OrgController`** 는 org/switch·invite·members 만 있고 **list-my-orgs 엔드포인트가 없다** → native 에서 `GET /auth/orgs` 404.

native 도 멤버십 cross-org(invite/accept)를 지원하므로 "내 org 목록"이 의미 있는데, 엔드포인트 부재로 native 모드가 불완전(provider 와 parity 결여).

### 해결 방안

native `OrgController` 에 **`GET /auth/orgs`** 추가. native 토큰 sub 은 **내부 userId** 이므로(`users.id`), `OrgListService` 에 **`listForUserId(userId)`**(= `WHERE memberships.userId`) 를 추가해 재사용. 응답 형태는 provider 와 동일(`{ orgs: OrgSummary[] }`) — 웹/클라가 모드 무관 동일 계약.

## 요구사항

1. `OrgListService.listForUserId(userId)` 추가 — 내 멤버십 org 목록(runWithSystemTenant + 정렬 + limit, provider 변형과 동일 패턴, 키만 `memberships.userId`).
2. native `OrgController` 에 `GET /auth/orgs` (`@UseGuards(AuthGuard)`) → `{ orgs: listForUserId(user.sub) }`.
3. `auth.module` 에 `OrgListService` provider 등록(+ TENANT_ALS·DATABASE 이미 global).
4. route-inventory EXPECTED_AUTH_ROUTES 갱신(`GET /auth/orgs [AuthGuard]` 추가), DI smoke + 격리 e2e 회귀 0.
5. 응답 계약이 provider `/auth/orgs` 와 동일(OrgSummary[]).

## Out of Scope

- 웹 변경 (현 웹은 provider 전용; 본 spec 은 native API parity. native 웹 지원은 별도).
- provider 경로 변경.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] native sub = 내부 userId 가정 — signin/signup 토큰이 `sub: user.id` 로 확인됨. 이에 `listForUserId` 가 `memberships.userId` 로 스코프.

## 핵심 전략

| 대상 | 변경 |
|:---:|:---|
| OrgListService | `listForUserId(userId)` 추가(`WHERE memberships.userId`, 정렬+limit) |
| native OrgController | `GET /auth/orgs` + OrgListService 주입 |
| auth.module | OrgListService provider |
| route-inventory | EXPECTED 에 `GET /auth/orgs [AuthGuard]` |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/org-list.service.ts`
`listForUserId(userId)` 추가(기존 listForProviderUid 와 동일 쿼리, 키만 변경).

#### [MODIFY] `apps/api/src/auth/org.controller.ts`
OrgListService 주입 + `@Get("orgs") @UseGuards(AuthGuard)` → `{ orgs }`.

#### [MODIFY] `apps/api/src/auth/auth.module.ts`
`OrgListService` provider 등록.

#### [MODIFY] `apps/api/src/auth/route-inventory.test.ts`
EXPECTED_AUTH_ROUTES 에 `GET /auth/orgs [AuthGuard]` 추가.

#### [NEW/MODIFY] 테스트
OrgListService.listForUserId 단위 + OrgController.orgs 단위(+ 가능 시 native e2e).

## 검증 계획

```bash
npx vitest --root apps/api run org-list org.controller route-inventory module-di
# native 실증: AUTH_MODE=native API + csrf→signup→GET /auth/orgs
npx turbo run lint typecheck test   # fresh 5434 DB
```

## 롤백 계획

- `git revert`. 엔드포인트 추가뿐, state/마이그레이션 없음.

## ✅ Definition of Done

- [ ] `listForUserId` + native `GET /auth/orgs` + auth.module provider
- [ ] route-inventory 갱신, DI smoke + e2e 회귀 0
- [ ] 단위 테스트 + native 실증(가입→/auth/orgs 내 org 반환)
- [ ] walkthrough/pr_description ship + push
