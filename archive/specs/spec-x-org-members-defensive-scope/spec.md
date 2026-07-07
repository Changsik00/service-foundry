# spec-x-org-members-defensive-scope: org-members 명시적 org 스코프 (defense-in-depth)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-org-members-defensive-scope` |
| **Branch** | `spec-x-org-members-defensive-scope` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Fix (보안 하드닝) |
| **작성일** | 2026-06-23 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황 (phase-24 회고 §W6 — 감사 완료)

`spec-x-null-org-isolation-failclose`(#179)로 cross-tenant 누수는 차단됐으나, 회고가 "얇은 방어선" 3건을 남겼다. 본 spec 착수 전 **전수 감사로 실태를 확정**:

- **A (RLS-off 인증 인프라)**: `0013` 이 users·sessions·failed_logins·lockouts·auth_audit_logs RLS 비활성. **감사 결과 — 모든 읽기가 `WHERE id/email/providerUid`(self) 또는 admin-gate. 무-WHERE 덤프 없음 → 실제 노출 0.**
- **B (raw `pool.query` 우회)**: api-key·org-switch 서비스가 interceptor 컨텍스트 밖. **감사 결과 — 전부 파라미터 `WHERE id/org_id` 보유 → 실제 노출 0.**
- **C (org-members 단일 방어선)**: `OrgMembersService.list` 가 `memberships` 를 **명시적 `WHERE org_id` 없이 RLS(+ 이제 interceptor fail-close)에만 의존**. 동작은 안전하나 **방어선 1겹**.

### 문제점

C 는 라이브 버그는 아니나, 실제 누수가 났던 바로 그 테이블(`memberships`)이 **단일 계층(RLS 컨텍스트 주입)에만 의존**한다. 그 한 계층(interceptor 컨텍스트)이 미래에 어긋나면 다시 누수. defense-in-depth 원칙상 애플리케이션 레이어에도 명시 스코프가 있어야 한다.

### 해결 방안

`OrgMembersService.list` 에 **명시적 `WHERE memberships.org_id = <activeOrg>`** 를 추가하고, 컨트롤러(native `org.controller`, provider `provider-org.controller`)가 `user.orgId` 를 전달한다. orgId 없으면 nil-uuid 로 0건(fail-closed, interceptor 와 동일 철학). A/B 는 감사로 안전 확인됨을 문서화(코드 변경 없음).

## 요구사항

1. `OrgMembersService.list` 가 active orgId 를 받아 `eq(memberships.orgId, orgId)` 로 명시 스코프 (RLS 와 독립적으로도 올바른 결과).
2. 두 컨트롤러가 `user.orgId` 전달. orgId 없으면 0건(nil-uuid 또는 가드).
3. 명시 WHERE 가 **RLS 와 무관하게** org 스코프함을 단위 테스트로 검증(이중방어 증명).
4. 기존 멤버 조회 e2e + 격리 e2e 회귀 0, lint/typecheck/test PASS.
5. A/B 감사 결과(안전)를 walkthrough 에 기록.

## Out of Scope

- A(RLS-off 테이블) RLS 재활성 — ADR-0024 §4 가 의도적으로 제외(인증 인프라는 org-scoped 아님). 감사로 안전 확인만.
- B raw-pool 경로 리팩토링 — 이미 명시 WHERE, 변경 불필요.
- pagination/limit 동작 변경(A5 는 별도 항목).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] orgId 없는 경우 처리: **nil-uuid → 0건(fail-closed, 추천)** vs 컨트롤러에서 명시 거부. interceptor 와 일관되게 nil-uuid 권장.

## 핵심 전략

| 대상 | 변경 |
|:---:|:---|
| `OrgMembersService.list` | `orgId` 파라미터 + `eq(memberships.orgId, orgId ?? NIL)` 조건 추가 |
| `org.controller` / `provider-org.controller` | `_user` → `user.orgId` 전달 |
| A/B | 변경 없음 — 감사 안전 확인 문서화 |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/org-members.service.ts`
`list(params)` 에 `orgId: string | null` 추가, conditions 에 `eq(memberships.orgId, orgId ?? NIL_UUID)`.

#### [MODIFY] `apps/api/src/auth/org.controller.ts` · `provider-org.controller.ts`
`orgMembers`/`members` 에서 `user.orgId` 를 `list` 에 전달.

#### [MODIFY] `apps/api/src/auth/org-members.email.test.ts` (또는 신규)
명시 WHERE org 스코프 단위 테스트 — RLS 없이도 타 org 행 제외.

## 검증 계획

```bash
npx vitest --root apps/api run org-members
# 회귀(로컬 5434 DB): 멤버 조회/격리 e2e
DATABASE_URL=... npx vitest --root apps/api run org-members member-search tenant-isolation
npx turbo run lint typecheck test
```

## 롤백 계획

- `git revert`. 조건 추가뿐, state/마이그레이션 없음.

## ADR 후보

- [x] 없음 (ADR-0024 §4·#7 기존 불변식 적용. defense-in-depth 보강)

## ✅ Definition of Done

- [ ] org-members.service 명시 `WHERE org_id` + 컨트롤러 orgId 전달
- [ ] RLS-독립 스코프 단위 테스트 + e2e 회귀 0
- [ ] A/B 감사 안전 확인 walkthrough 기록
- [ ] lint/typecheck/test PASS
- [ ] walkthrough/pr_description ship + push
