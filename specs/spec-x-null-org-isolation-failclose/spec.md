# spec-x-null-org-isolation-failclose: 인증-null-org 토큰 RLS fail-close (cross-tenant 누수 차단)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-null-org-isolation-failclose` |
| **Branch** | `spec-x-null-org-isolation-failclose` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Fix (보안) |
| **작성일** | 2026-06-23 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황 (재현 확인됨)

phase-24 회고 보안 패널이 발견, **DB+코드+엔드포인트로 재현**한 cross-tenant 데이터 누수:

- `TenantContextInterceptor`(`packages/nestjs/tenant/src/index.ts`)는 `orgId` 가 없으면 **미인증/부트스트랩과 인증-null-org 를 동일 취급** → tx 미생성·`SET LOCAL` 미발행 → RLS 가 NULL 컨텍스트 = **퍼미시브(전 행 노출)**.
- `GET /auth/org/members`(native `org.controller.ts:74` + provider `provider-org.controller.ts:51`, **둘 다 `@UseGuards(AuthGuard)` 만**)는 `OrgMembersService.list()` 가 **명시적 `WHERE org_id` 없이 RLS 에만 의존**(`org-members.service.ts:26` 주석으로 의도 명시).
- **재현(로컬 5434, app_runtime, SET LOCAL 없음)**: `SELECT count(*),count(distinct org_id) FROM memberships` → **78행 / 66 org** 전부 가시. 컨텍스트 설정 시 0.

### 문제점

**정상 발급된** 인증 토큰이지만 `orgId=null` 인 경우 — OAuth 로그인 사용자(`oauth.service.ts:85` 가 `activeOrgId` claim 없이 서명) 또는 org 미설정 native 사용자(`signin.service.ts` `!user.orgId` 경로) — 가 `GET /auth/org/members` 호출 시 **전 테넌트 멤버십+이메일+표시이름 노출**. 위조 아님(서명/인증 통과). phase-24 회귀는 아닌 standing 결함이나, 격리 e2e 6/6 이 **orgId 있는 토큰만** 검증해 미탐지.

### 해결 방안

**interceptor fail-close (systemic)**: 인증됐는데(`req.user` 존재) `orgId` 가 null 이면, permissive-null 대신 **불가능 org 컨텍스트(nil-uuid)로 tx+`SET LOCAL`** → RLS 가 모든 org-scoped 행을 차단. 미인증(`req.user` 없음)은 기존 permissive-null 유지(signup/csrf/bootstrap 필요). 이 한 곳 수정으로 org-scoped **모든 RLS-only 엔드포인트**가 동시에 보호된다.

정당한 인증-null-org 흐름(내 org 목록·전환·초대수락)은 `runWithSystemTenant`(명시적 system 컨텍스트 토글)을 쓰므로 영향 없음 — 그들은 tx 안에서 `app.current_org=''`(system)로 토글 후 복원.

## 요구사항

1. interceptor: `req.user` 존재 + `orgId` null → 불가능 컨텍스트(nil-uuid)로 tx+SET LOCAL (fail-closed).
2. 미인증(`req.user` 없음) → 기존 permissive-null 유지 (bootstrap 회귀 0).
3. `orgId` 존재 → 기존 동작 유지.
4. 단위 테스트로 세 분기 검증 + 정당 system-context 흐름(runWithSystemTenant) 회귀 0.
5. 전체 lint/typecheck/test + 격리 e2e 회귀 0.

## Out of Scope

- OAuth 사용자 personal org 자동 provisioning (별도 — 제품 결정).
- `OrgMembersService` 방어적 WHERE (interceptor fail-close 가 systemic 차단 — 필요 시 후속 defense-in-depth).
- RLS 정책 SQL 변경 (정책은 정상 — 앱 컨텍스트 주입이 문제).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 수정 위치: **interceptor(systemic, 추천)** vs 서비스별 방어 WHERE(국소). systemic 이 모든 RLS-only 엔드포인트를 한 번에 닫음.

> [!WARNING]
> - [ ] 인증-null-org 가 이제 org-scoped 직접 쿼리에서 0행 — 정당 흐름은 runWithSystemTenant 경유라 무영향이나, 혹시 RLS 직접 의존하던 인증-null 경로가 있으면 회귀. e2e+단위로 확인.

## 핵심 전략

| 분기 | 현재 | 수정 후 |
|:---:|:---|:---|
| 미인증 (req.user 없음) | permissive null | **유지** (bootstrap) |
| 인증 + orgId null | permissive null ← **누수** | **fail-closed** (nil-uuid 컨텍스트, RLS 전면 차단) |
| 인증 + orgId 있음 | tx + SET LOCAL orgId | 유지 |

## Proposed Changes

#### [MODIFY] `packages/nestjs/tenant/src/index.ts`
interceptor 에 인증-null-org 분기 추가 — nil-uuid 컨텍스트로 tx+SET LOCAL (fail-closed). `req.user` 존재 여부로 미인증과 구분.

#### [MODIFY] `packages/nestjs/tenant/src/index.test.ts`
세 분기 단위 테스트: 미인증→permissive, 인증+null→nil 컨텍스트 tx, 인증+org→org 컨텍스트.

#### [NEW/MODIFY] (가능 시) e2e
인증-null-org 토큰 → `GET /auth/org/members` → 빈 결과(누수 없음) 회귀 가드.

## 검증 계획

```bash
npx turbo run test typecheck --filter=@repo/nestjs-tenant
# 회귀(로컬 5434 DB): 격리 e2e + 전체
DATABASE_URL=... npx vitest --root apps/api run tenant-isolation e2e.test
npx turbo run lint typecheck test
```

수동 검증:
1. (재현) null 컨텍스트 memberships 전 org 가시 → 수정 후 인증-null 경로는 nil 컨텍스트라 0행.
2. signup/csrf(미인증) 정상 — bootstrap 회귀 0.

## 롤백 계획

- `git revert`. interceptor 분기 추가뿐, state/마이그레이션 없음. (fail-closed 방향이라 롤백 시 누수 복귀 — 주의)

## ADR 후보

- [ ] 후보: tenant interceptor 의 "인증-null-org = fail-closed" 불변식 — ADR-0024 보강 가치 (type: invariant). Plan Accept 시 결정.

## ✅ Definition of Done

- [ ] interceptor fail-close (인증-null→nil 컨텍스트), 미인증 permissive 유지
- [ ] 단위 3분기 테스트 + 격리 e2e 회귀 0
- [ ] lint/typecheck/test PASS
- [ ] walkthrough/pr_description ship + 브랜치 push
- [ ] (선택) ADR-0024 보강
