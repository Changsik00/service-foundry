# Task List: spec-x-auth-sub-normalize

> One Task = One Commit. 원자적 리팩토링 — verifier+소비처는 함께. 실 HTTP/CI provider e2e 회귀 0.

---

## Task 1: 브랜치
- [ ] `git checkout -b spec-x-auth-sub-normalize` (base: `main`)

## Task 2: supabase verifier sub=내부 id + 소비처 원자 전환 (TDD)
### 2-1. 테스트 (Red)
- [ ] supabase verifier 단위: 멤버/신규/비멤버 → `sub`=internalUserId (mock 포트 internalUserId 반환). 기존 sub=providerUid 기대 테스트 갱신
- [ ] Commit: `test(spec-x-auth-sub-normalize): provider verifier sub = internal user id`
### 2-2. 구현 (Green)
- [ ] 포트(supabase/firebase) internalUserId 노출 + `getOrgMembership` 반환 확장. `provision.service` 반영
- [ ] supabase verifier: 양 경로 sub=internalUserId (firebase 대칭 확인)
- [ ] 소비처 전환: `listForProviderUid`→`listForUserId`, `findByProviderUid` 제거, `resolveInternalUserId`/`inviteForProvider`/`acceptForProvider` 제거 → `listForUserId`/`findById`/`invite`/`accept`
- [ ] 단위/native e2e PASS, typecheck
- [ ] Commit: `refactor(spec-x-auth-sub-normalize): unify sub to internal id + drop providerUid consumers`

## Task 3: OrgSwitchService 모드감지 통합 (TDD)
- [ ] `OrgSwitchService.switch` 내부 모드감지(native 토큰재발급 / provider users.orgId UPDATE). `ProviderOrgSwitchService` 제거. 단위 갱신
- [ ] Commit: `refactor(spec-x-auth-sub-normalize): merge org switch into mode-aware OrgSwitchService`

## Task 4: provider 컨트롤러 통합 + 모듈 정리
- [ ] `ProviderMeController`/`ProviderOrgController` 삭제 → native `AuthController`/`OrgController` 양모드 처리. `provider-auth.module`/`auth.module` 라우팅 정리
- [ ] native e2e 회귀 0, typecheck
- [ ] Commit: `refactor(spec-x-auth-sub-normalize): route provider mode through native controllers`

## Task 5: ADR §4 갱신
- [ ] `docs/adr/0028` §4 "후속"→채택
- [ ] Commit: `docs(spec-x-auth-sub-normalize): ADR-0028 §4 sub normalization adopted`

## Task 6: Ship
### 🚦 Gate
- [ ] `turbo run lint typecheck test` (fresh 5434) → 회귀 0
- [ ] `/hk-refute` (provider 신뢰·격리 인접)
### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-x-auth-sub-normalize): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] push + PR (base: `main`) — CI provider e2e 게이트
