# Implementation Plan: spec-17-08

## 📋 Branch Strategy

- 신규 브랜치: `spec-17-08-tenant-isolation-request-path` (= spec 디렉토리명)
- 시작 지점 / PR base: **`phase-17`** (base 브랜치 모드)
- 첫 task 가 브랜치 생성

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **RLS 적용 범위 정정 (spec-17-03 변경)**: RLS 를 `organizations`·`memberships`·`invitations` 에만 두고 **auth 인프라(users·sessions·failed_logins·lockouts·auth_audit_logs)에서 제거**. 근거: 세션·rate-limit·user 는 org-스코프 도메인 데이터가 아니라 인증 인프라(로그인 시점=무컨텍스트, 사용자는 멤버십으로 다중 org 소속). org_id 컬럼은 분석용으로 유지하되 RLS 강제는 안 함. (대안: 전 테이블 org_id 백필+write 배선 — 훨씬 침습적·세션 회귀 위험. 비채택)
> - [ ] **클레임 계약**: AuthGuard 가 `activeOrgId` 를 읽도록 수정(현재 `orgId`). 서명/검증이 공유하는 상수로 고정.
> - [ ] **시스템 컨텍스트 seam**: 토큰 기반 invite accept 의 invitation 조회는 무-tenant 컨텍스트로 실행(토큰 자체가 인가). org admin 의 invitation *목록* 은 여전히 RLS 적용.

> [!WARNING]
> - [ ] 마이그레이션 0013 이 일부 테이블의 RLS/정책을 DROP — 되돌릴 수 있게 down 경로 문서화.
> - [ ] 통합 테스트용 신규 endpoint `GET /auth/org/members`(active org 멤버 목록, RLS 보호) 추가 — 작은 read 표면.

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **클레임 매핑** | guard 가 `activeOrgId` 읽기 + 공유 상수 `ACTIVE_ORG_CLAIM` | C-1 근본 수정 + 표류 차단 |
| **signin/refresh** | `activeOrgId=user.orgId`, `orgRole`=멤버십 조회 | C-2, 로그인 사용자 컨텍스트 확보 |
| **RLS 범위** | 도메인 3 테이블만(orgs/memberships/invitations) | C-3, 세션/인증 회귀 차단 + 의미 정합 |
| **cross-org 조회** | 시스템 컨텍스트 seam(`runWithSystemTenant`/base pool) | C-4, 토큰 인가 기반 accept |
| **invite accept** | email 바인딩 + 멤버십 unique 처리 + tx 원자화 | C-5/W-1, 인가 우회 차단 |
| **검증** | 실 HTTP(supertest)→토큰→guard→interceptor→RLS 통합 + 음성 가드 | 거짓 GREEN 재발 차단 |

### 📑 ADR 후보
- [x] `tenant-isolation-runtime-role-and-als-tx` (type: invariant) — 머지 시점 작성.

## 📂 Proposed Changes

### 1. 실 HTTP 통합 테스트 (TDD Red)
#### [NEW] `apps/api/src/auth/tenant-isolation.http.e2e.test.ts`
- 앱 부팅(real PG, app_runtime). 유저 A signup→org A 토큰, 유저 B signup→org B 토큰.
- `GET /auth/org/members` 를 A 토큰으로 호출 → **org A 멤버만** 반환(B 안 보임). 음성: 컨텍스트 누락 시 B 노출되면 실패.
- 초기 RED(C-1 로 컨텍스트 미설정 → B 노출).

### 2. 클레임 계약 (C-1)
#### [MODIFY] `packages/nestjs/auth/src/auth.guard.ts`
- `result.value.activeOrgId` → `req.user.orgId`. 공유 상수 도입(`packages/backend/auth-jwt` 또는 contracts 의 `ACTIVE_ORG_CLAIM="activeOrgId"`). guard 단위 테스트 갱신.

### 3. signin/refresh 클레임 (C-2)
#### [MODIFY] `apps/api/src/auth/signin.service.ts`
- user.orgId → `activeOrgId`, 멤버십 role → `orgRole` 주입(서명 2곳). orgId 없으면(레거시) 생략. 단위 테스트.

### 4. RLS 범위 정정 (C-3)
#### [NEW] `apps/api/drizzle/0013_rls_scope_domain_only.sql` (+journal)
- `DROP POLICY` + `DISABLE ROW LEVEL SECURITY` on users·sessions·failed_logins·lockouts·auth_audit_logs. organizations·memberships·invitations 정책 유지.
- 회귀 검증: refresh/signin/rate-limit 흐름 GREEN.

### 5. 시스템 컨텍스트 seam + invite accept (C-4/C-5/W-1)
#### [MODIFY] `apps/api/src/infra/tenant.ts`
- `runWithSystemTenant(fn)` — ALS tx 를 비워(또는 base pool) cross-org 시스템 조회 허용 헬퍼.
#### [MODIFY] `apps/api/src/auth/org-invite.service.ts`
- accept: 시스템 컨텍스트로 invitation 조회 → `invitation.email === user.email` 검증(user 로드) → membership unique 충돌 처리 → 단일 tx(insert membership + update acceptedAt). 단위 테스트(email 불일치 거부·중복·만료·재사용).

### 6. 통합 테스트용 endpoint
#### [NEW] `GET /auth/org/members` (`auth.controller.ts` + service)
- active org 멤버 목록(RLS 로 자동 스코프). AuthGuard 보호.

### 7. ADR (W-3)
#### [NEW] `docs/adr/00NN-tenant-isolation-enforcement.md` (type: invariant)

## 🧪 검증 계획 (Verification Plan)

### 단위 + 통합
```bash
DATABASE_URL=<app_runtime> DATABASE_MIGRATE_URL=<owner> pnpm --filter @apps/api test
```

### 전체 게이트 (fresh DB)
```bash
pnpm turbo run knip depcruise lint typecheck test build
```

### 수동 검증
1. A 토큰 `GET /auth/org/members` → org A 멤버만. B 토큰 → org B 만.
2. refresh(유효 쿠키) → 200 (세션 RLS 제거 회귀 0).
3. invite: A 가 B 이메일 초대 → B 가 accept → membership 추가. 타인 토큰 accept → 거부(email 불일치).

## 🔁 Rollback Plan
- 0013 down: 제거한 테이블 RLS/정책 재생성(0011/0012 정책 복원 SQL 보관).
- 코드: 브랜치 revert. guard/claim 변경은 국소.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 전 task 완료 + walkthrough/pr ship
