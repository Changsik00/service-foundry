# Walkthrough: spec-x-org-members-defensive-scope

> phase-24 회고 §W6(얇은 방어선 A/B/C) 후속 — org-members 명시 org 스코프(defense-in-depth).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 수정 범위 | A/B/C 전부 / 실 변경 필요분만 | **C 만 코드 변경, A/B 는 감사 확인** | 감사 결과 A/B 는 실제 노출 0 — 코드 변경 불필요 |
| orgId 없을 때 | 컨트롤러 거부 / nil-uuid 0건 | **nil-uuid 0건(fail-closed)** | interceptor(spec-x #179)와 일관, 단일 분기 |

## 💬 사용자 협의 / 감사

- "1번(보안 A/B/C)" 진행. **착수 전 전수 감사로 스코프 확정** → A/B 안전, C 만 실 변경.

## 🔍 감사 결과 (A/B — 안전 확인, 코드 변경 없음)

- **A (RLS-off 인증 인프라)**: `0013` 이 users·sessions·failed_logins·lockouts·auth_audit_logs RLS 비활성. 전 읽기 감사 → `WHERE id/email/providerUid`(self) 또는 admin-gate(`@Roles("admin")`). **무-WHERE 덤프 0.**
- **B (raw `pool.query` 우회)**: api-key·org-switch 서비스 → 전부 파라미터 `WHERE id/org_id`. interceptor 밖이지만 **노출 0.**
- **C (org-members)**: `memberships` 를 `WHERE org_id` 없이 RLS+interceptor 단일 의존 → 본 spec 에서 명시 스코프 추가.

## 🧪 검증 결과

- **단위**: `org-members.service.test` — orgId 전달 시 명시 org 조건 항상 적용 / orgId null → nil-uuid 0건 (RLS 없는 mock 에서도 조건 존재 = 이중방어). org/provider-org 컨트롤러 테스트에 orgId 전달 반영.
- **전체 게이트(fresh DB)**: `turbo run lint typecheck test` **151/151**, e2e 회귀 0.
- **회귀 디버깅 교훈**: 장기 공유 테스트 컨테이너(누적 수백 행 + lockout 상태)에서 signin/refresh/session e2e 가 오탐 실패 → **fresh DB 재생성 후 151/151** 확인. 누적 상태 오염, 코드 무관.

## 🔧 변경

- `org-members.service.ts`: `list({ orgId })` + `eq(memberships.orgId, orgId ?? NIL_ORG)` 항상 적용.
- `org.controller`·`provider-org.controller`: `user.orgId` 전달.
- 테스트: 단위 Red→Green, org-members.e2e 의 AuthGuard stub 이 실 가드처럼 `req.user` 세팅하도록 정정.

## 🚧 이월

- A5(목록 limit), auto 거버넌스 정식화, route-inventory Wd, 패키지 reference 문서 — queue Icebox.
