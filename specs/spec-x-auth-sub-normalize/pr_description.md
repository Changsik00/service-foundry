refactor(spec-x-auth-sub-normalize): unify sub to internal id + drop providerUid duplication

## 📋 Summary

### 배경 및 목적
`AuthenticatedUser.sub` 가 모드별 다형(native=내부 users.id, supabase=providerUid)이라 provider 전용 우회·중복이 존재했다(phase-26 §4 이월). provider verifier 가 **providerUid→내부 users.id 를 해석**해 sub 를 모드 무관 내부 id 로 통일하고, providerUid 우회를 제거한다.

### 주요 변경 사항
- [x] supabase/firebase verifier: 양 경로 **sub=내부 users.id**(provision 포트 internalUserId surface). firebase 와 대칭.
- [x] providerUid 우회 제거: `listForProviderUid`·`findByProviderUid`·`resolveInternalUserId`·`inviteForProvider` → `listForUserId`/`findById`/`invite`. provider switch/accept 는 sub 직접 사용(resolve 삭제).
- [x] **fail-close 유지**: 비멤버·provision 부재+claim → orgId=null (26-04 S3).
- [x] ADR-0028 §4 채택. net **-109줄**.

### 타입
- **Refactor (식별자 부채 / 보안 인접)** · spec-x → main

## 🎯 Key Review Points
1. **sub 정규화**: provision 포트 재사용(verifier DB 주입 회피). 5경로(provision신규/claim+멤버/claim+비멤버/claim+provision없음/orgId없음) 모두 의도대로 — verifier 단위 커버.
2. **fail-close 회귀 방지**: 구현 중 supabase no-provision+claim 이 한 번 fail-OPEN 으로 깨졌고 단위가 즉시 RED → 복원. 양 verifier S3 유지.
3. **토큰 모델 보존**: provider switch/invite-accept 는 재발급 없이 users.orgId UPDATE(ADR-0026) 유지 — 완전 native 통합 아님(컨트롤러 구조통합은 후속, Out-of-Scope 명시).
4. **`/hk-refute` 반영**: W1(spec DoD 정직화)·W2(provision 실메서드 단위)·W3(cruft) 수정.

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB
```
- verifier 단위(supabase/firebase) + provision 메서드 단위 + 소비처 단위 PASS.
- 전체 **154/154 tasks**, native 회귀 0.
- ⚠️ provider 실경로(providerUid→내부 id 해석)는 **CI provider e2e 가 최종 가드**(로컬 vitest 불가).

## 📦 Files Changed
- `packages/nestjs/auth-supabase/src/{supabase-verifier,supabase-provision-port}.ts`, `auth-firebase/src/{firebase-verifier,firebase-provision-port}.ts` + tests
- `apps/api/src/provision/provision.service.ts` + test
- `apps/api/src/auth/{org-list,account.stores,org-invite,provider-org.controller,provider-me.controller,provider-org-switch.service}.ts` + tests
- `docs/adr/0028-public-id-scheme.md` §4

## ✅ Definition of Done
- [x] sub=내부 id(양 verifier), providerUid 우회 제거, fail-close 유지
- [x] native 회귀 0 + verifier/provision 단위 + ADR §4
- [ ] CI provider e2e GREEN (이 PR push 후 확인)
- [x] (이월) 컨트롤러 구조통합 → Icebox

## 🔗 관련
- ADR-0028 §4·0026·0029, phase-26 §4. 컨트롤러 통합 후속 spec-x 후보.
