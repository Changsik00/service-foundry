---
id: ADR-0029
type: invariant
date: 2026-06-25
status: accepted
---

# ADR-0029: provider active_org 는 멤버십 검증 후에만 신뢰 (fail-close)

## 📚 Context

멀티테넌트 격리는 RLS 컨텍스트(`app.current_org`)에 의존하고, 이 값은 요청자의 active_org(`AuthenticatedUser.orgId`)에서 온다. **RLS 정책은 `org_id = app.current_org` *매칭*일 뿐 요청자가 그 org 의 멤버인지 확인하지 않는다** — 즉 컨텍스트 자체의 신뢰성이 격리의 전제다.

native 모드는 `POST /auth/org/switch` 가 멤버십을 DB 검증한 뒤 토큰을 재서명하므로 active_org 가 신뢰 가능했다. 그러나 **provider 모드(supabase/firebase)의 verifier 는 JWT 의 active_org 클레임(또는 `app_metadata.active_org`)을 멤버십 검증 없이 그대로 채택**했다(spec-26-04 적대적 감사 발견). app_metadata 쓰기 가능 설정·멤버십 박탈 후 stale 클레임 시 타 org 컨텍스트를 획득할 수 있었다.

## 🎯 Decision (Invariant)

1. **provider verifier 는 active_org 클레임을 멤버십 DB 검증 후에만 채택한다.** 멤버면 그 orgRole 을 반영하고, **비멤버면 fail-close**(orgId=null → `TenantContextInterceptor` 가 FAIL_CLOSED 컨텍스트로 RLS 0행).
2. **검증 수단(provision 포트)이 없으면 클레임을 신뢰하지 않는다 — 역시 fail-close.** 포트 미배선(다운스트림 오설정)이 silent fail-OPEN 으로 빠지지 않게 한다.
3. **org-scoped 신뢰 경로는 raw pool(무-RLS) 로 질의하지 않는다.** RLS 가 적용되는 요청 tx(`database.db`) 를 경유해 defense-in-depth 를 유지한다(예: api_keys). pre-auth 전-org 조회(verifyKey)만 예외(시크릿 기반).
4. RLS 컨텍스트의 신뢰성 = "그 org 의 멤버만 그 컨텍스트를 얻는다" 가 불변식이다. 신규 인증 모드·식별자 해석(public_id 등)을 추가할 때 이 게이트를 반드시 통과시킨다.

## 📊 Consequences

- **긍정**: provider 모드도 native 와 대칭으로 active_org 가 신뢰 가능. 컨텍스트 오염 공격면 제거. provider orgRole 이 멤버십에서 채워져 org-scoped 가드 정상 동작(이전엔 항상 null=fail-close).
- **부정 (성능)**: provider 요청당 멤버십 lookup 1회 추가(verifier). provider 는 이미 매 요청 provision 경로가 있어(ADR-0026) 한계 증가는 작다.
- **중립**: 멤버십 검증은 verifier 단계(인터셉터 이전, RLS 컨텍스트 없음)라 system-level 조회로 동작.

## 🔀 Alternatives

- **interceptor 에서 멤버십 게이트**: 모드 무관 단일 seam 이나, `sub` 다형성(provider=providerUid)으로 어차피 provider 해석이 필요 → provider verifier 가 적합. native 는 switch 가 이미 게이트(중복 회피).
- **RLS 정책을 NULL-permissive→fail-close 로 flip**: 컨텍스트 미설정 자체를 차단. 강력하나 system-tenant·bootstrap 경로 영향 큼 → 별도 분석(Out of scope, Icebox).

## 🔗 Related

- [[ADR-0024]] tenant isolation(RLS) · [[ADR-0026]] active-org 운반 · [[ADR-0023]] 권위 모드 · spec-26-04
