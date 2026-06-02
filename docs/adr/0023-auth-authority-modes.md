---
id: ADR-0023
type: decision
date: 2026-06-02
status: accepted
---

# ADR-0023: 인증 권위 모드 (native / firebase / supabase) + app 클레임 운반

## 📚 Context

이슈 #108: 프론트의 세션 권위(provider SDK)와 백엔드의 인가 권위(native EdDSA JWT)가 분리돼 있다. `frontend-auth-firebase`/`-supabase` 어댑터로 앱을 구성하면 사용자는 프론트에서 로그인되지만 그 세션으로 보호 API 를 호출하면 `AuthGuard`(native JWT 만 검증)가 거부한다 → "Firebase/Supabase 를 쓰는 이유(클라이언트 SDK 의 편리한 세션/토큰 관리)"가 무력화.

핵심 통찰(설계 협의): **Firebase/Supabase 를 고른다는 건 그 provider 를 인증 권위로 삼겠다는 뜻**이다. 우리 native JWT 로 교환(exchange)하면 provider SDK 의 세션 관리 이점이 사라지고 프론트가 두 토큰(provider 세션 + native JWT)을 동시에 들어야 하는 모순이 생긴다. → 우리 걸 강제하지 않고 **고른 권위를 그대로 신뢰·검증**해야 한다.

## 🎯 Decision

**인증 권위를 교체 가능한 배포 모드로 만든다.** 보일러플레이트는 3모드를 모두 제공하고, 사용자는 하나만 남기고 나머지를 삭제한다(멀티 프로바이더 = 진짜 교체 가능, 안 쓰면 지운다).

| 모드 | 인증 권위 | 백엔드 검증 | app 클레임(org_id/role) 주입 |
|---|---|---|---|
| **native** (provider 미사용) | 우리 EdDSA JWT | 기존 `verifyAccessToken`(keystore) | 우리 JWT 클레임에 직접 |
| **firebase** | Firebase 세션 | Firebase ID token (Firebase JWKS 검증) | Admin SDK `setCustomUserClaims(uid, { active_org_id, org_role })` → ID token 클레임 |
| **supabase** | Supabase 세션 | Supabase JWT (project secret/JWKS 검증) | custom access token hook / `app_metadata` 로 클레임 주입 |

- **AuthGuard 를 verifier-pluggable** 로 만든다 — 설정된 모드의 검증기를 끼우는 인터페이스(`AccessTokenVerifier`). native 모드는 기존 동작 불변.
- **app 클레임 운반의 단일 규약**: active org_id·org-role 은 *access token 클레임*으로 전달된다(권위가 무엇이든). native=우리 JWT, provider=provider custom-claim. → [[ADR-0022]] 의 "active org in token" 결정과 정합.
- **org 전환·가입 시** 백엔드가 클레임을 갱신: native=토큰 재발급, provider=custom-claims 갱신 후 provider 토큰 refresh.
- **provider-user → org 프로비저닝**: provider 모드에선 가입이 provider(Firebase/Supabase)에서 일어나므로, 백엔드는 그 유저를 **처음 본 순간(first authenticated request 또는 provider webhook)** 에 [[ADR-0022]] 의 *공용 프로비저닝 seam* 을 호출해 개인 org + owner 멤버십을 생성한다. native signup 과 동일 seam → 경로 중복 없음.
- provider 모드를 쓰면 native 전용 endpoint(password/oauth/mfa/passkey)는 provider 가 대체하므로 *삭제* 대상(보일러플레이트 정리).

## 📊 Consequences

- **긍정**: provider 를 고른 이유(세션관리 편의)를 유지 — 프론트 토큰 1개, provider SDK 가 refresh 담당. "권위 교체 가능" 철학 실현. native·OAuth·provider 가 동일한 클레임 규약(active_org_id/org_role)으로 수렴 → 인가 코드는 권위에 무관.
- **부정**: `AuthGuard` 가 다중 verifier(native/firebase/supabase) 지원 → 검증 표면↑. org 클레임 주입이 **provider별 글루**(Firebase `setCustomUserClaims` vs Supabase hook — 메커니즘 상이). org 전환 지연이 provider 토큰 refresh 주기에 묶임. provider 모드는 authz 클레임에 대해 provider 결합(lock-in 일부).
- **중립**: 검증기·클레임주입기를 `@repo/nestjs-auth`(또는 provider별 어댑터 패키지)에 인터페이스로 노출. 프론트 `AuthProvider` 는 모드와 무관하게 동작(이미 SDK 어댑터 추상화 존재).

## 🔀 Alternatives

- **(기각) provider 토큰 → native JWT 교환(exchange)**: `/auth/provider/exchange` 로 provider 토큰을 native JWT 로 교환. 비채택 이유: provider SDK 의 세션 관리 이점 무력화 + 프론트 이중 토큰. "provider 를 고른 의미"를 깨뜨림(설계 협의 결론).
- **(기각) native 단일·provider 미지원**: 단순하나 멀티 프로바이더 보일러플레이트 가치 상실.
- **(기각) provider 토큰 일원화(native 제거)**: 이미 구축한 native(password/oauth/mfa/passkey) 자산 폐기. native 모드 사용자 미지원.

## 📌 Status

Accepted (2026-06-02). 이슈 #108 해소 방향. 구현은 **phase-19(인증 권위 모드)** — 멀티테넌시 spine(phase-18) 직후로 배치해, org 프로비저닝 seam 이 fresh 할 때 native·provider 를 동시에 배선(재작업 회피). AuthGuard verifier 인터페이스 + provider별 클레임 주입기 + provider→org 프로비저닝. native 모드는 현 상태로 이미 동작(클레임에 active_org_id 추가만 필요). 인증 권위(본 ADR)와 인가 규칙(RBAC, phase-21)은 phase 분리.

## 🔗 Related

- 이슈 #108 (token bridge) — 본 ADR 이 해소
- [[ADR-0022]] — 멀티테넌시(active org in token 규약)
- [[ADR-0017]] — auth provider SDK prop contract, [[ADR-0018]] — auth provider 패키지 위치
- `packages/frontend/auth-firebase`, `auth-supabase`, `packages/nestjs/auth`(AuthGuard)
