# Implementation Plan: spec-x-org-api

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] provider active-org = DB 운반 (ADR-0026) — 기존 verifier provision fallback 배선과 일관. 대안(Supabase custom claim)은 admin SDK+refresh 복잡도로 비채택
> - [x] org-screens 와 분할 (백엔드 선행) — right-size

## 🎯 핵심 전략

| 결정 | 선택 | 이유 |
|---|---|---|
| 전환 방식 | `users.orgId` UPDATE | verifier 가 매 요청 DB 를 읽는 기존 모델 — 즉시 적용·무상태 |
| 목록 조회 | OrgListService + 시스템 컨텍스트 | memberships 는 org-RLS — 내 전체 멤버십은 교차-org (invite 서비스의 runWithSystemTenant 선례) |
| accept 분리 | OrgInviteService 에 provider 경로 메서드 추가 (acceptForProvider) | invite 검증·멤버십 생성 로직 재사용, native accessToken 재발급만 분기 |
| members email | users join 추가 (기존 RLS 무절충 — users 는 시스템 테이블) | 화면 실용성. RLS 검증 표면(주석) 성격 유지 |
| 컨트롤러 | ProviderOrgController 신설 (ProviderAuthModule) | native auth.controller 와 분리 — 모드별 표면 명확 |

## 📂 Proposed Changes

- Task 1: [NEW] `org-list.service.ts` + ProviderOrgController(GET /auth/orgs) + ADR-0026
- Task 2: [NEW] `provider-org-switch.service.ts` + POST /auth/org/switch
- Task 3: [MODIFY] org-members(email join) + org-invite(acceptForProvider) + invite/accept/members 마운트
- Task 4: api e2e (provider org 시나리오 — CI) + ship

## 🧪 검증 — 단위 TDD (기존 mock-db 패턴) + CI real-PG e2e + native 회귀
## 🔁 Rollback — PR revert
