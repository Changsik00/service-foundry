# spec-19-05: RBAC 배선 (org-role 기반 인가)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-19-05` |
| **Phase** | `phase-19` |
| **Branch** | `spec-19-05-rbac-wiring` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-13 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

JWT에는 `orgRole` 클레임(`ORG_ROLE_CLAIM = "orgRole"`)이 이미 포함되어 있다 — signup / signin / org-switch 모두 memberships 테이블에서 읽어 토큰에 서명한다. 그러나 `VerifiedIdentity` / `AuthenticatedUser`가 해당 클레임을 **추출하지 않아** `req.user`에 orgRole이 없다.

`packages/nestjs/auth`의 `RolesGuard`는 앱 레벨 role(`user | admin`)만 처리한다. org 레벨 role(`owner | admin | member`) 기반의 Guard가 없고, 보호가 필요한 라우트(`POST /auth/org/invite` 등)에도 Guard가 배선되어 있지 않다.

### 문제점

- `POST /auth/org/invite` — 현재 `AuthGuard`만 적용. `member` 권한 사용자도 초대 가능.
- `GET /auth/org/members` — Guard 없음, 인증만 되면 접근 가능 (RLS가 스코프하지만 명시적 role 체크 없음).
- orgRole이 JWT에 있는데도 Guard에서 읽지 못함 — 잠재적 인가 구멍.

### 해결 방안 (요약)

1. `VerifiedIdentity` / `AuthenticatedUser`에 `orgRole: string | null` 추가 — JWT `orgRole` 클레임 추출.
2. `OrgRolesGuard` + `@OrgRoles` 데코레이터 신규 — org-scoped 라우트 인가.
3. `packages/backend/authz` 신규 — 프레임워크 독립 pure policy 함수(`canInviteMember`, `canManageOrg`).
4. `POST /auth/org/invite` → `@OrgRoles("admin", "owner")` 배선 — member 403.

## 🎯 요구사항

### Functional Requirements

1. `AuthenticatedUser.orgRole: string | null` — JWT `orgRole` 클레임에서 추출, 없으면 null.
2. `OrgRolesGuard` — `@OrgRoles(...)` 메타데이터 기반, `req.user.orgRole` 검증, 불일치 시 403.
3. `@OrgRoles` 데코레이터 — `SetMetadata(ORG_ROLES_KEY, roles)`.
4. `packages/backend/authz` 순수 함수: `canInviteMember(orgRole)`, `canManageOrg(orgRole)`.
5. `POST /auth/org/invite` — `@OrgRoles("admin", "owner")` 적용, member 시도 → 403.
6. e2e: member가 invite 시도 → 403, admin/owner → 200.

### Non-Functional Requirements

1. `packages/backend/authz` — NestJS 의존 없음 (framework-agnostic).
2. 기존 app-level `RolesGuard` 동작 변경 없음 (backward compatible).
3. `AuthGuard` 변경 — orgRole 추출 실패 시 요청 거부 없음 (orgRole 없는 토큰도 허용, null 처리).

## 🚫 Out of Scope

- 멤버 강퇴 / 조직 삭제 엔드포인트 (신규 — phase-19 이후 또는 spec-19-07 확장)
- `GET /auth/org/members` role 게이팅 (RLS로 스코프 보장, 별도 role 체크 불필요 — icebox)
- OrgRole을 DB에서 실시간 재조회하는 Guard (JWT 클레임 기반으로 충분 — token rotation 주기 내 일관성)
- Swagger 데코레이터 추가 (spec-19-04에서 처리)

## 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음 → `rbac-jwt-claim-vs-db-lookup` (tradeoff: JWT orgRole 클레임 신뢰 vs DB 실시간 조회)
- [ ] 없음

## 🔗 관련 문서

- 관련 ADR: ADR-0022 (multitenancy-foundation), ADR-0024 (tenant-isolation-enforcement)
- 관련 spec: spec-19-03 (session-management), spec-17-08 (tenant-isolation)

## ✅ Definition of Done

- [ ] `OrgRolesGuard` 단위 테스트 PASS
- [ ] `AuthGuard` orgRole 추출 테스트 추가 PASS
- [ ] `packages/backend/authz` 단위 테스트 PASS
- [ ] e2e: member invite 403 + admin invite 200 PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-19-05-rbac-wiring` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
