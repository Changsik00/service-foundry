---
id: ADR-0026
type: decision
date: 2026-06-11
status: accepted
---

# ADR-0026: provider 모드 active-org 운반 — DB(users.orgId) + verifier provision fallback

## 📚 Context

ADR-0022 는 "active org = access token 클레임 + 전환 endpoint"로 결정했고, ADR-0023 은 provider
권위 모드에서 custom claim 으로 운반한다고 했다. 그러나 실제 배선(spec-x-auth-http-integration 이후)을
조사한 결과, provider(supabase) 모드는 이미 다르게 동작한다:

- Supabase 토큰에는 자체 `activeOrgId` 클레임이 없다 (Auth Hook/app_metadata 미구성)
- `SupabaseVerifier` 는 클레임 부재 시 **매 요청** `provisionFromProvider()` 를 호출하고,
  이 함수가 `users.orgId`(DB) 를 active org 로 반환한다

즉 provider 모드의 active org 는 사실상 DB 가 단일 출처다. org 전환 표면(spec-x-org-api)을 만들며
이 운반 방식을 결정으로 명문화한다.

## 🎯 Decision

1. **provider 모드 active org 의 단일 출처 = `users.orgId` (DB).**
   전환(`POST /auth/org/switch`)은 membership 검증 후 `users.orgId` UPDATE — 다음 요청부터
   verifier fallback 이 새 org 를 반환하므로 토큰 재발급·refresh 불필요. 응답은 `{ orgId }`.
2. native 모드는 기존대로 토큰 클레임 + 재발급 (ADR-0022 유지). 모드별 운반이 다름을 인정하고
   컨트롤러를 분리한다 (`ProviderOrgController` vs native `auth.controller`).
3. 교차-org 조회(내 조직 목록 등)는 `runWithSystemTenant` 시스템 컨텍스트 패턴을 따른다
   (invite accept 의 선례 — spec-17-08 C-4).

## 📊 Consequences

- **긍정**: admin SDK·토큰 갱신 흐름 없이 전환이 원자적(UPDATE 1회)·즉시 적용. 기존 verifier
  배선과 무변경 일관.
- **부정 (성능)**: provider 모드는 매 요청 provision DB 트랜잭션을 탄다 (기존 동작 — 본 결정으로
  악화되진 않음). 트래픽 증가 시 Supabase Auth Hook(JWT claims) + app_metadata 운반으로 전환해
  요청-경로 DB 조회를 제거할 수 있다 — 그 시점에 verifier 의 클레임-우선 경로는 이미 구현돼 있어
  (top-level/app_metadata 클레임 판독) 서버 코드는 hook 구성만으로 호환.
- **중립**: 클라이언트는 전환 후 토큰을 유지한 채 콘솔 쿼리 invalidate 만 하면 된다.

## 🔀 Alternatives

- **Supabase app_metadata + admin SDK + 클라 refreshSession**: 클레임 정공법이나 admin secret 을
  api 에 추가하고 전환마다 refresh 왕복 필요. 매 요청 provision 이 이미 존재하는 현 구조에서
  즉각 이득 없음 → 성능 필요 시점의 업그레이드 경로로만 기록.
- **세션 테이블에 active org**: native refresh 세션과 provider 무세션 모델이 갈라져 있어 공통화 불가.

## 🔗 Related

- [[ADR-0022]] 멀티테넌시 (native 클레임 운반) · [[ADR-0023]] 권위 모드 · spec-x-org-api
