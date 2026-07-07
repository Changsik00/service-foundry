fix(spec-26-04): active_org membership gate + api_keys RLS backstop (security)

## 📋 Summary

### 배경 및 목적
phase-26 식별자 조사 중 적대적 감사로 드러난 **사전존재 High 보안 갭 2건** 수정(사용자 지시 "보안 먼저"). org public_id(26-05)보다 선행.

### 주요 변경 사항
- [x] **A — provider active_org 멤버십 게이트**: supabase/firebase verifier 가 JWT active_org 클레임을 **멤버십 DB 검증 후에만** 채택. 비멤버·검증수단(provision 포트)부재 시 **fail-close**(orgId=null→RLS 0행). provider `orgRole` 도 멤버십에서 채움(이전 항상 null).
- [x] **B — api_keys RLS backstop**: list/revoke/create 를 `database.db`(인터셉터 tx=RLS) 경유로 이관(기존 raw pool 은 RLS 미적용). `WHERE org_id` defense-in-depth 보존, verifyKey(pre-auth)만 raw.
- [x] **ADR-0029** (invariant): provider active_org 신뢰 모델 명문화.

### 타입
- **Fix (security / 멀티테넌트 격리)** · spec-26-04 → `phase-26-id-scheme-public-id`

## 🎯 Key Review Points
1. **RLS 는 멤버십을 안 본다**(org_id=context 매칭일 뿐) → 컨텍스트 신뢰성이 격리 전제. A 가 provider 의 컨텍스트 신뢰성을 native 수준으로 맞춤.
2. **fail-close 철저**: 비멤버 + **포트 부재(다운스트림 미배선)** 모두 orgId=null. 보일러플레이트 silent fail-OPEN 방지.
3. **검증 2단계(`/hk-refute`) 수행**: 독립 Opus 반증이 S3(포트부재 fail-OPEN)·S1(가짜 격리 e2e) 지적 → 둘 다 수정(fail-close 정정 + 실 RLS-backstop 테스트 추가).

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB
```
- verifier 단위 7+7(멤버/비멤버/포트부재/무-claim), api_keys e2e 9(격리 + RLS backstop 단독 실증).
- 전체 **154/154 tasks**, 회귀 0.
- ⚠️ A(provider)는 로컬 vitest 완전 검증 불가(supabase 토큰) → 단위(mock 포트)+CI e2e. B 는 native e2e 실증.

## 📦 Files Changed
- `packages/nestjs/auth-supabase/src/{supabase-verifier,supabase-provision-port}.ts` + test
- `packages/nestjs/auth-firebase/src/{firebase-verifier,firebase-provision-port}.ts` + test
- `apps/api/src/provision/provision.service.ts` (getOrgMembership)
- `apps/api/src/auth/api-key.service.ts` + `api-key.e2e.test.ts` (+ 단위 mock)
- `docs/adr/0029-provider-active-org-trust.md`

## ✅ Definition of Done
- [x] provider active_org 멤버십 게이트(비멤버·포트부재 fail-close) + orgRole
- [x] api_keys org-scoped RLS backstop
- [x] verifier 단위 + api_keys 교차-org/RLS e2e + 회귀 0
- [x] walkthrough/pr_description + ADR-0029

## 🔗 관련
- ADR-0029/0024/0026, spec-26-04, 후속 26-05(org public_id)·26-06(나머지 root)·26-07(누출 스냅샷)
- 이월: RLS NULL-permissive flip, provider role→admin(IdP), provision orgRole 하드코딩(backlog)
