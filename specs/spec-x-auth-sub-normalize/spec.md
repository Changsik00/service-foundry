# spec-x-auth-sub-normalize: sub 식별자 정규화 + provider 중복 제거

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-auth-sub-normalize` |
| **Branch** | `spec-x-auth-sub-normalize` (base: `main`) |
| **상태** | Planning |
| **타입** | Refactor (식별자 부채 청산 / 보안 인접) |
| **작성일** | 2026-06-26 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

`AuthenticatedUser.sub` 가 **모드별 다형**: native=내부 `users.id`, supabase=`providerUid`(firebase 는 provision 경로에서 이미 internalUserId 로 정규화). 이 다형성 때문에 provider 전용 우회/중복이 존재: `listForProviderUid`, `findByProviderUid`, `resolveInternalUserId`, `inviteForProvider`/`acceptForProvider`, `ProviderMeController`/`ProviderOrgController`/`ProviderOrgSwitchService`. (phase-26 §4 후속 이월, ADR-0028 §4)

### 문제점

- 컨슈머가 sub 의미를 알아야 함 → 분기·중복(~200-250줄), 잠재 버그원(식별자 의미 모호성).
- provider /me 가 `findById ∥ findByProviderUid` 양쪽 시도(의미 미상).

### 해결 방안

**supabase verifier 에서 providerUid→내부 `users.id` 를 1회 해석**해 `AuthenticatedUser.sub` 를 모드 무관 내부 id 로 통일(firebase 와 대칭). 그 결과 provider 전용 우회/중복을 제거하고 native 컨트롤러/서비스로 통합. **원자적**(verifier 변경 ↔ 소비처 전환 분리 불가).

## 요구사항

1. **supabase verifier sub=내부 id**: provision 포트가 internalUserId 를 노출(`provisionFromProvider` 포트 타입 + `getOrgMembership` 반환에 internalUserId 추가). verifier 가 양 경로(provision 신규 / 멤버 검증 기존)에서 sub=internalUserId 설정. 해석 불가(미존재 등) → 기존 fail-close 유지.
2. **소비처 내부-id 전환(원자)**: `listForProviderUid`→`listForUserId` 단일화, `findByProviderUid` 제거(`findById` 단일), `resolveInternalUserId` 제거, `inviteForProvider`/`acceptForProvider`→`invite`/`accept` 통합.
3. **provider 서비스 providerUid resolve 제거**: `ProviderOrgSwitchService`·`acceptForProvider` 가 sub(내부 id)를 직접 사용(providerUid→user 조회 삭제). 토큰 모델 차이(provider 재발급 없음, ADR-0026)는 유지.
4. **ADR-0028 §4 갱신**: "후속" → **채택**(sub 단일 의미).
5. **회귀 0**: native 기존 e2e + provider verifier 단위(mock 포트) + CI provider e2e.

## Out of Scope

> **범위 축소 (구현 중 결정, refute W1 반영)**: 당초 "provider 컨트롤러(`ProviderMeController`/`ProviderOrgController`/`ProviderOrgSwitchService`) **삭제 후 native 통합**"을 계획했으나, provider 모드가 native `AuthController`(password/oauth/mfa 포함)를 통째로 import 할 수 없고 provider 토큰 모델(재발급 없음)이 native 와 다르므로 **컨트롤러 구조 통합은 분리**한다. 본 spec 은 **sub 정규화 + 서비스레벨 providerUid 중복 제거**(핵심 부채)에 집중하고, thin provider 컨트롤러는 *동일 내부-id 메서드를 호출*하도록만 전환. **컨트롤러/모듈 구조 통합 → 후속 spec-x 후보(Icebox)**.

- provider 컨트롤러 삭제·native 컨트롤러 통합 (위 — 후속).
- 내부 PK v7 전환, RLS NULL-permissive flip, provider role→admin — 무관.
- JWT `sub` 클레임(native 내부 id 서명) — 무변경(§1).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **정규화 위치 = supabase verifier(provision 포트 재사용)**. verifier 에 DATABASE 직접 주입 아님 — 포트가 이미 DB 작업 수행, internalUserId 만 surface.
> - [ ] **원자적 변경**: verifier+소비처+컨트롤러가 한 PR. 큰 편이나 분리 시 중간 상태가 깨짐.

> [!WARNING]
> - [ ] provider 모드 변경 → 로컬 vitest 완전검증 불가. verifier 단위 + CI provider e2e + `/hk-refute`(ship 전).
> - [ ] provider 토큰 재발급 불가(IdP 발급) — switch 통합 시 provider 분기는 DB UPDATE 유지(토큰 불변).

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| supabase verifier | provision 포트로 sub=내부 id | firebase 대칭, DB 주입 회피 |
| 소비처 | providerUid 메서드 제거, 내부-id 단일화 | 다형성 제거(원자) |
| switch | 단일 서비스 모드감지 | 중복 제거, ADR-0026 토큰 모델 유지 |
| 컨트롤러 | provider 전용 삭제→native 통합 | ~200줄 제거 |

## Proposed Changes

- [MODIFY] `packages/nestjs/auth-supabase/src/{supabase-verifier,supabase-provision-port}.ts` — sub=internalUserId, 포트 internalUserId 노출
- [MODIFY] `packages/nestjs/auth-firebase/src/firebase-provision-port.ts` — getOrgMembership internalUserId 대칭(필요 시)
- [MODIFY] `apps/api/src/provision/provision.service.ts` — getOrgMembership 반환 internalUserId
- [MODIFY] `apps/api/src/auth/org-list.service.ts`(listForProviderUid 제거)·`account.stores.ts`(findByProviderUid 제거)·`org-invite.service.ts`(resolve/forProvider 제거)·`org-switch.service.ts`(모드감지)
- [DELETE] `provider-me.controller.ts`·`provider-org.controller.ts`·`provider-org-switch.service.ts`
- [MODIFY] `provider-auth.module.ts`·`auth.module.ts` 라우팅
- [MODIFY] `docs/adr/0028-public-id-scheme.md` §4

## 검증 계획

```bash
turbo run lint typecheck test   # fresh 5434 DB
```
1. supabase verifier 단위(mock 포트): 멤버/신규/비멤버 → sub=internalUserId
2. native e2e(auth/org/격리/api-key/session) 회귀 0
3. CI provider e2e: provider 로그인→orgs/switch/invite/me 정상
4. `/hk-refute` (provider 신뢰·격리 인접)

## 롤백 계획

- `git revert` (단일 PR). DB/마이그 무변경.

## ADR 후보

- [x] ADR-0028 §4 갱신(본 spec). 신규 ADR 불요(기존 결정 시행).

## ✅ Definition of Done

- [ ] supabase/firebase sub=내부 id (양 verifier 5경로), providerUid 우회 제거(`listForProviderUid`/`findByProviderUid`/`resolveInternalUserId`/`inviteForProvider`), provider switch/accept sub 직접 사용
- [ ] native 회귀 0 + verifier 단위 + provision 신규 메서드 단위(resolveInternalUserId·getOrgMembership internalUserId) + ADR §4 갱신
- [ ] CI provider e2e GREEN + `/hk-refute` Go + walkthrough/pr_description
- [ ] (이월) provider 컨트롤러/모듈 구조 통합 → 후속 spec-x Icebox
