# spec-17-04: 개인 워크스페이스 자동 생성 + 유저 프로비저닝 seam

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-17-04` |
| **Phase** | `phase-17` |
| **Branch** | `spec-17-04-personal-workspace-provisioning` |
| **Base Branch** | `phase-17` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-06-06 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

`organizations` · `memberships` 스키마와 `users.org_id` 컬럼이 추가됐지만, 신규 유저 등록(`POST /auth/signup`) 시 개인 org와 owner 멤버십이 생성되지 않는다. `users.org_id`는 NULL인 채로 남는다.

### 문제점

1. `users.org_id`가 채워지지 않아 spec-17-05(JWT 클레임 + RLS strict)의 `active_org_id` 클레임 발급이 불가능하다.
2. 멀티테넌시 컨텍스트가 없는 사용자가 존재해 RLS 격리가 무의미하다.

### 해결 방안

`ProvisionService.provisionUser(userId, email)` 함수를 구현하고 `SignupService`에 연결한다. 한 트랜잭션 안에서: 개인 org 생성 → owner 멤버십 삽입 → `users.org_id` 업데이트. provider-agnostic 설계 — phase-18 OAuth first-login도 동일 seam 호출.

## 📊 프로비저닝 흐름

```
POST /auth/signup
  └─ SignupService.signUp()
       ├─ users.insert()          (기존)
       ├─ sessions.insert()       (기존)
       └─ ProvisionService.provisionUser(userId, email)  ← NEW
            └─ db.transaction()
                 ├─ organizations.insert({ isPersonal:true, slug:UUID, name:email prefix, ownerId })
                 ├─ memberships.insert({ userId, orgId, role:'owner' })
                 └─ users.update({ orgId }) WHERE id=userId
```

## 🎯 요구사항

### Functional Requirements

1. `ProvisionService.provisionUser(userId, email)` — DB 트랜잭션으로 3 쿼리 원자 실행
2. 개인 org: `slug = randomUUID()`, `name = email 앞 부분(@이전)`, `isPersonal = true`, `ownerId = userId`
3. owner 멤버십: `role = 'owner'`
4. `users.org_id` 업데이트 — `null → 생성된 org.id`
5. `SignupService.signUp()` — user 생성 + 세션 생성 후 `provisionUser()` 호출
6. `users.role` 필드 deprecation 주석 (`@deprecated`) — 데이터/코드 제거는 spec-17-05 이후

### Non-Functional Requirements

1. 트랜잭션 실패 시 전체 롤백 (org 생성 없이 user만 남는 불일치 상태 방지)
2. `ProvisionService`는 apps/api 내부 서비스 — 별도 패키지 불필요 (provider-agnostic이지만 단일 앱)
3. 단위 테스트: ProvisionService (mock DB) + SignupService (mock ProvisionService)

## 🚫 Out of Scope

- OAuth/provider first-login 연동 — phase-18에서 동일 seam 재사용
- `users.role` 필드 제거 — spec-17-05 이후
- org 전환 / 멤버십 조회 API — spec-17-05~06
- 이미 존재하는 유저 대상 마이그레이션 — 별도 데이터 마이그레이션 스크립트 (scope 외)

## 📑 ADR 후보

- [x] 없음 (ADR-0022 §Decision 항목 3 "유저 프로비저닝 seam" 에 이미 확정)

## 🔗 관련 문서

- `docs/adr/0022-multi-tenancy-strategy.md` §Decision 3
- spec-17-03 (users.org_id 컬럼 — 선행 조건)
- spec-17-05 (active_org_id JWT 클레임 — 이 spec 이후)

## ✅ Definition of Done

- [ ] `ProvisionService.provisionUser()` 구현 + 단위 테스트 GREEN
- [ ] `SignupService`에 `ProvisionService` 주입 + 기존 테스트 GREEN
- [ ] `users.role` `@deprecated` 주석 추가
- [ ] typecheck + lint PASS
- [ ] `walkthrough.md` + `pr_description.md` ship
