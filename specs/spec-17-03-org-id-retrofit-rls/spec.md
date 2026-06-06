# spec-17-03: org_id retrofit + Postgres RLS

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-17-03` |
| **Phase** | `phase-17` |
| **Branch** | `spec-17-03-org-id-retrofit-rls` |
| **Base Branch** | `phase-17` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes (기존 e2e 회귀 검증) |
| **작성일** | 2026-06-06 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

`organizations` · `memberships` · `invitations` 스키마가 추가됐지만(spec-17-02), 기존 테이블(`users` · `sessions` · `failed_logins` · `lockouts` · `auth_audit_logs`)에는 `org_id` 컬럼이 없고 Row Level Security(RLS)도 적용돼 있지 않다.

### 문제점

1. spec-17-04(프로비저닝 seam)가 `users.org_id`를 쓰기 위한 컬럼이 없다.
2. 멀티테넌시 격리가 전적으로 애플리케이션 레이어에 의존한다 — DB 레이어 보장 없음.

### 해결 방안

기존 테이블에 `org_id uuid NULLABLE` 컬럼을 추가하고, 8개 테이블 전체에 **퍼미시브 RLS**를 적용한다. 퍼미시브 RLS는 `app.current_org` 미설정 시 전체 행 접근을 허용하므로 기존 e2e 테스트가 그대로 통과하면서, spec-17-05에서 SET 매커니즘이 활성화되면 자동으로 격리가 강제된다.

## 📊 영향 테이블

| 테이블 | 위치 | org_id 추가 | RLS |
|---|---|:---:|:---:|
| `users` | `apps/api/src/infra/schema/users.ts` | ✅ Drizzle | ✅ |
| `organizations` | `apps/api/src/infra/schema/organizations.ts` | — (id가 곧 org) | ✅ |
| `memberships` | `apps/api/src/infra/schema/memberships.ts` | — (org_id 이미 있음) | ✅ |
| `invitations` | `apps/api/src/infra/schema/invitations.ts` | — (org_id 이미 있음) | ✅ |
| `sessions` | `packages/backend/auth-session/src/schema.ts` | ✅ 패키지 수정 | ✅ |
| `failed_logins` | `packages/backend/auth-rate-limit/src/schema.ts` | ✅ 패키지 수정 | ✅ |
| `lockouts` | `packages/backend/auth-rate-limit/src/schema.ts` | ✅ 패키지 수정 | ✅ |
| `auth_audit_logs` | `packages/backend/auth-audit/src/audit-log.schema.ts` | ✅ 패키지 수정 | ✅ |

## 🎯 요구사항

### Functional Requirements

1. `users.org_id uuid NULL` — FK → organizations(id), spec-17-04가 채워 넣을 필드
2. `sessions.org_id uuid NULL` — 세션이 어느 org 컨텍스트에서 생성됐는지 기록용
3. `failed_logins.org_id uuid NULL` / `lockouts.org_id uuid NULL` — org 스코프 rate-limit 기반
4. `auth_audit_logs.org_id uuid NULL` — org 스코프 감사 로그
5. 8개 테이블 전체에 퍼미시브 RLS 정책 적용

### RLS 정책 정의

```sql
-- 일반 테이블 (org_id 컬럼 보유)
USING (
  current_setting('app.current_org', true) IS NULL
  OR org_id = current_setting('app.current_org', true)::uuid
)

-- organizations 특수 케이스 (자신이 org)
USING (
  current_setting('app.current_org', true) IS NULL
  OR id = current_setting('app.current_org', true)::uuid
)
```

### Non-Functional Requirements

1. 기존 e2e 테스트 전체 GREEN (RLS가 퍼미시브이므로 컨텍스트 없어도 통과)
2. `drizzle-kit generate` 에러 없이 org_id 컬럼 migration 생성
3. RLS migration은 별도 raw SQL 파일(`0010_rls_policies.sql`)로 분리

## 🚫 Out of Scope

- RLS strict 모드 전환 — spec-17-05에서 SET 매커니즘 활성화 후 별도 처리
- `users.org_id` 데이터 채우기 — spec-17-04 프로비저닝 seam
- 패키지 테이블에 FK 제약 선언 (org_id 컬럼만 추가, FK는 앱 레이어 관리)

## 📑 ADR 후보

- [x] 없음 (ADR-0022에 RLS 전략 이미 확정됨)

## 🔗 관련 문서

- `docs/adr/0022-multi-tenancy-strategy.md`
- spec-17-02 (organizations/memberships 스키마 — 선행 조건)
- spec-17-04 (users.org_id 데이터 채우기)
- spec-17-05 (RLS strict 전환 + SET 매커니즘)

## ✅ Definition of Done

- [ ] `users.org_id` 컬럼 추가 (Drizzle 스키마 + drizzle-kit migration)
- [ ] sessions/failed_logins/lockouts/auth_audit_logs `org_id` 컬럼 추가 (패키지 수정 + drizzle-kit migration)
- [ ] 8개 테이블 퍼미시브 RLS raw SQL migration
- [ ] typecheck 통과 (수정된 패키지 + api 포함)
- [ ] 기존 e2e 테스트 GREEN
- [ ] `walkthrough.md` + `pr_description.md` ship
