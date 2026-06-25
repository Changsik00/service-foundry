# Walkthrough: spec-26-04

> 보안 하드닝 — provider active_org 멤버십 게이트(A) + api_keys RLS backstop(B).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 멤버십 게이트 위치 | interceptor / **provider verifier** | provider verifier | sub 다형성으로 어차피 provider 해석 필요; native 는 switch 가 이미 게이트 |
| 비멤버 claim | personal org 폴백 / **null fail-close** | null fail-close | RLS 0행, 안전 우선 |
| **포트 부재 시(S3)** | claim 신뢰 / **fail-close** | **fail-close** | 보일러플레이트 다운스트림 포트 미배선 시 silent fail-OPEN 방지(반증 발견) |
| api_keys 격리 | raw pool+WHERE / **database.db(RLS)+WHERE** | RLS 경유 | backstop 복원, WHERE 는 defense-in-depth. verifyKey(pre-auth)만 raw |
| ADR | — | **ADR-0029(invariant)** | provider active_org 신뢰 모델 명문화 |

## 💬 사용자 협의

- 적대적 감사 후 사용자 지시 "보안 먼저" → org public_id(26-05)보다 선행.

## 🔍 검증 2단계 (`/hk-refute`) 결과 — 반영함

독립 Opus 반증이 **조건부 No-Go** + 실재 결함 2건 지적, 모두 수정:
- **S3 (High)**: verifier 게이트가 `else if (orgId && this.provision)` 라 **포트 부재 시 claim 통과(fail-OPEN)**. → `else if (orgId)` 로 바꿔 포트 없으면 fail-close. 보일러플레이트라 다운스트림 재발 방지가 핵심. (`supabase/firebase-verifier.ts`)
- **S1 (가짜 안전망)**: api_keys 격리 e2e 가 `WHERE org_id` 로도 통과 → RLS 계층 단독 미실증. → `WHERE` 없이 `app.current_org` 컨텍스트만으로 api_keys 가 스코프되는지 검증하는 **실 RLS-backstop 테스트** 추가(org B 키 존재하므로 RLS 꺼지면 실패하는 진짜 테스트).
- A 게이트 로직·양쪽 클레임 위치·거짓 락아웃 없음은 반증 통과(견고) 확인.

## 🧪 검증 결과

- 단위(verifier supabase/firebase 7+7): claim+멤버→채택+orgRole / 비멤버→fail-close / **포트부재→fail-close** / 무-claim→provision.
- e2e(api_keys 9): 교차-org 격리 + **RLS backstop 단독 실증**.
- 전체 게이트(fresh 5434): turbo lint+typecheck+test **154/154 tasks**, 회귀 0.

## 🔧 변경

- provision 포트(supabase/firebase) + IProvisionService: `getOrgMembership(providerUid, orgId)` 추가.
- supabase/firebase verifier: claim active_org 멤버십 게이트(비멤버·포트부재 fail-close) + orgRole 채움.
- `provision.service.ts`: `getOrgMembership` 구현(providerUid→users.id→memberships, system-level).
- `api-key.service.ts`: list/revoke/create → `database.db`(RLS tx). verifyKey raw 유지.
- ADR-0029 신설.

## 🚧 이월 (Out of Scope / backlog)

- RLS NULL-permissive → fail-close flip (구조·위험, Icebox).
- C(provider role→admin 클레임, IdP 의존), provision 무-claim orgRole="owner" 하드코딩(반증 S4, 사전존재) → backlog.
- `sub` 의미 통일(native=내부 id/provider=providerUid) → ADR-0028 §4 후속.
