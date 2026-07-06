# Walkthrough: spec-x-auth-sub-normalize

> sub 식별자 정규화 — provider verifier 가 providerUid→내부 users.id 해석해 `AuthenticatedUser.sub` 모드 무관 통일 + providerUid 우회 중복 제거. (phase-26 §4 후속, ADR-0028 §4 채택)

## 📌 결정 기록

| 이슈 | 결정 | 이유 |
|---|---|---|
| 정규화 위치 | **provision 포트 재사용**(internalUserId surface) | verifier DB 직접 주입 회피, firebase 와 대칭 |
| 범위 (구현 중 축소) | sub 정규화 + **서비스레벨 dedup**; 컨트롤러 구조통합 후속 | provider 가 native AuthController(password/oauth/mfa) 통째 import 불가 + provider 토큰 모델(재발급 없음) 상이 → 구조통합 분리 |
| provider switch/accept | sub 직접 사용(resolve 제거) + 토큰 모델 유지 | ADR-0026 재발급 없음 보존 |

## 💬 사용자 협의

- "규모 작으면 spec-x" → phase 아닌 spec-x. 구현 중 "범위 커지면 분할" 안전판대로 **컨트롤러 통합을 후속 분리**(spec 정직화).

## 🔍 검증 2단계 (`/hk-refute`) 결과 — 반영

독립 Opus 반증: 코드 견고(Go 수준), No-Go 조건 2 + 🟡:
- **W1 (DoD 불일치)**: spec 이 컨트롤러 삭제·통합 명시했으나 미수행(구두 축소) → **spec.md Out-of-Scope/DoD 정직화**(컨트롤러 통합 후속 Icebox).
- **W2 (provision 실메서드 동어반복)**: resolveInternalUserId·getOrgMembership internalUserId 가 verifier mock 으로만 검증 → **provision.service.test 단위 4건 추가**.
- **W3 (cruft)**: org-members.e2e stale `inviteForProvider` mock 정리.
- fail-close(양 verifier S3)·교차테넌트 불가·JWT sub 불변·internalUserId 진정성 = 반증 통과.
- **회귀 자가포착**: 구현 중 supabase no-provision+claim 이 fail-OPEN 으로 깨졌고(26-04 S3 역행) verifier 단위가 즉시 RED → fail-close 복원 후 GREEN.

## 🧪 검증 결과

- verifier 단위(supabase/firebase 각 5경로) + provision 신규 메서드 단위 + 소비처 단위 PASS.
- 전체 게이트(fresh 5434): turbo lint+typecheck+test **154/154 tasks**, native 회귀 0. net **-109줄**.
- provider 실경로 → **CI provider e2e 가 최종 가드**(로컬 vitest 불가).

## 🔧 변경

- 포트(supabase/firebase): `provisionFromProvider` internalUserId + `getOrgMembership`→{orgRole,internalUserId} + `resolveInternalUserId` 신설.
- verifier: 양 경로 sub=internalUserId, 비멤버 fail-close+resolve, **provision 부재+claim fail-close 유지(S3)**.
- provision.service: getOrgMembership internalUserId + resolveInternalUserId.
- 소비처: `listForProviderUid`/`findByProviderUid`/`resolveInternalUserId`/`inviteForProvider` 제거 → `listForUserId`/`findById`/`invite`. provider 컨트롤러/switch/accept 가 sub(내부 id) 직접 사용.
- ADR-0028 §4 채택.

## 🚧 이월 (Icebox)

- provider 컨트롤러/모듈 구조 통합(`ProviderMeController`/`ProviderOrgController` 삭제→native 라우팅) — token-model 차이로 신중, 후속 spec-x.
