# spec-26-04: active_org 멤버십 게이트 + api_keys RLS backstop (보안 하드닝)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-26-04` |
| **Phase** | `phase-26` |
| **Branch** | `spec-26-04-active-org-membership-gate` |
| **Base 브랜치** | `phase-26-id-scheme-public-id` |
| **상태** | Planning |
| **타입** | Fix (security / 멀티테넌트 격리) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

phase-26 식별자 조사 중 **사전존재 High 보안 갭 2건**이 적대적 감사에서 드러났다(내 phase-26 작업과 무관). 사용자 지시로 org public_id(26-05)보다 **보안 먼저** 처리.

### 문제점 (감사 발견)

- **A (High) — provider active_org 멤버십 미검증**: `supabase-verifier.ts:53-61` / `firebase-verifier.ts:30` 는 토큰의 `active_org` 클레임(또는 `app_metadata.active_org`)을 **멤버십 DB 검증 없이** RLS 컨텍스트로 사용한다. native(`org-switch`)는 멤버십 검증 후 재서명하는데 **provider 는 비대칭**. RLS 정책은 `org_id = app.current_org` *매칭*일 뿐 **멤버십을 확인하지 않으므로**, 컨텍스트가 타 org 로 오염되면(stale 클레임·app_metadata 쓰기 가능 시) 그 org 행이 노출된다.
- **B (High) — api_keys 가 RLS backstop 없음**: `api-key.service.ts:70-89` 의 list/revoke 가 `database.pool`(raw, 인터셉터 tx 밖) 로 쿼리 → `app.current_org`(tx-local) 미설정 → api_keys RLS 정책의 `current_setting IS NULL` 분기가 **permissive**. 격리가 `WHERE org_id=claim` 한 줄에만 의존(단일 계층).

### 해결 방안

**A**: provider verifier 가 active_org 클레임을 신뢰하기 전에 **멤버십을 DB 검증**한다(provision 포트 확장: providerUid→내부 userId 해석 + 멤버십 확인 + orgRole 반환). 비멤버면 **fail-close**(orgId=null → 인터셉터 FAIL_CLOSED → RLS 0행). 부수효과로 provider `orgRole` 도 멤버십에서 채워진다(현재 항상 null).
**B**: api_keys 의 **post-auth org-scoped 연산(list/revoke/create)** 을 `database.db`(인터셉터 tx = RLS 적용)로 이관. `verifyKey`(pre-auth, 시크릿으로 전-org 조회)는 raw 유지. `WHERE org_id` 는 defense-in-depth 로 보존.

## 요구사항

1. **provision 포트 확장**: providerUid + claimOrgId → `{ internalUserId, orgRole } | null`(멤버십 있으면 orgRole, 없으면 null). supabase/firebase 양쪽 포트.
2. **provider verifier 멤버십 게이트**: claim 에 active_org 가 있으면 멤버십 검증; **멤버 아니면 orgId=null(fail-close)**. provision(무-claim) 경로는 개인 org 생성 → 멤버 보장이므로 그대로.
3. **orgRole 채움**: 멤버십 검증 시 orgRole 을 VerifiedIdentity 에 반영(provider org-scoped 가드 정상화).
4. **api_keys RLS backstop**: list/revoke/create → `database.db`(ALS tx). `verifyKey` raw 유지(이유 주석). `WHERE org_id` 보존.
5. **불변식(감사 도출)**: 해석 실패=거부(무컨텍스트 폴백 금지) / 멤버십 재검증 / raw pool 은 org-scoped 신뢰 경로서 배제.
6. **회귀 0 + 격리 실증**: native+provider e2e PASS. api_keys 교차-org 격리 e2e(org A 토큰이 org B 키 미열람).

## Out of Scope

- org public_id 도입 (→ 26-05)
- **RLS NULL-permissive 정책을 fail-close 로 뒤집기** — runWithSystemTenant(빈 컨텍스트)·bootstrap 경로 영향 큼, 별도 분석 필요(Icebox). 본 spec 은 *컨텍스트 신뢰성*(A)과 *raw pool 우회 제거*(B)로 대응.
- C(provider role→admin 클레임): IdP 설정 의존, 코드 방어 한계 — backlog 기록만.
- `sub` 의미 통일(native=내부 id, provider=providerUid): 26-03 ADR §4 후속 후보 유지.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **멤버십 게이트 위치 = provider verifier** (interceptor 아님). 근거: interceptor 는 sub 다형성(provider sub=providerUid)이라 어차피 provider 해석 필요 → provider 경계에서 처리가 적합. native 는 org-switch 가 이미 게이트(중복 회피).
> - [ ] **비멤버 claim → null fail-close** (개인 org 폴백 아님). 안전 우선(불변식 #1).

> [!WARNING]
> - [ ] provider 모드 변경은 **로컬 vitest 로 완전 검증 불가**(supabase 토큰 필요) → verifier **단위 테스트(mock 포트)** 로 게이트 로직 검증 + CI e2e(provider) 회귀. api_keys(B)는 native e2e 로 실증.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **A 게이트** | provider verifier + provision 포트 확장 | 모드-적합, sub 해석 1곳, native 중복 회피 |
| **비멤버 처리** | orgId=null fail-close | RLS 0행, 안전 우선 |
| **orgRole** | 멤버십에서 채움 | provider org-가드 정상화(부수 이득) |
| **B** | api_keys org-scoped → database.db | RLS backstop 복원, verifyKey 만 raw |

## Proposed Changes

#### [MODIFY] `packages/nestjs/auth-supabase/src/supabase-provision-port.ts` (+firebase 대응)
- 포트에 멤버십 해석 추가: `resolveActiveOrg(providerUid, claimOrgId?): { internalUserId, orgId, orgRole } | null` (또는 기존 provisionFromProvider 확장). claimOrgId 멤버십 검증 포함.

#### [MODIFY] `packages/nestjs/auth-supabase/src/supabase-verifier.ts`, `auth-firebase/src/firebase-verifier.ts`
- claim active_org → 멤버십 검증 후에만 채택, 비멤버 fail-close. orgRole 반영.

#### [MODIFY] `apps/api/src/**/provision*.ts` (포트 구현)
- providerUid→users.id 해석 + `memberships(userId, orgId)` 조회(시스템 컨텍스트) 구현.

#### [MODIFY] `apps/api/src/auth/api-key.service.ts`
- list/revoke/create → `this.database.db`(drizzle, ALS tx). verifyKey raw 유지 + 주석. WHERE org_id 보존.

#### [NEW] e2e/unit
- verifier 단위(mock 포트): 멤버→orgId+orgRole 채택 / 비멤버→null. api_keys 교차-org 격리 e2e.

## 검증 계획

```bash
turbo run lint typecheck test   # fresh 5434 DB
```
수동/통합 시나리오:
1. (단위) provider verifier: claim orgB + 비멤버 → orgId=null. 멤버 → orgId=orgB+orgRole — 기대: PASS
2. (e2e) org A 토큰으로 GET /auth/api-keys → org B 키 미포함; revoke 타 org 키 → 403 — 기대: PASS
3. 기존 auth/org/api-key/격리 e2e 회귀 0 — 기대: PASS

## 롤백 계획

- `git revert`. DB/마이그레이션 무변경(로직·쿼리 경로만). state 영향 없음.

## ADR 후보

- [ ] provider active_org 신뢰 모델(멤버십 게이트) → ADR 가치 있음. 후보 `provider-active-org-trust` (type: invariant). walkthrough 판단 후 결정.

## ✅ Definition of Done

- [ ] provider verifier active_org 멤버십 게이트(비멤버 fail-close) + orgRole 채움
- [ ] api_keys org-scoped 연산 RLS backstop(database.db)
- [ ] verifier 단위 + api_keys 교차-org 격리 e2e + 회귀 0
- [ ] walkthrough/pr_description + push (+ ADR 판단)
