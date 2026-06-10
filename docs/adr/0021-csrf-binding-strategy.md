---
id: ADR-0021
type: decision
date: 2026-06-01
status: accepted
---

# ADR-0021: CSRF 토큰 바인딩 전략 — per-client `csrf_id` (session 비의존)

> [!NOTE]
> 본문의 `apps/web-vite` 전제는 [ADR-0025](./0025-frontend-app-consolidation.md)(frontend 앱 단일화, 2026-06-10)로 대체됨.

## 📚 Context

phase-15(spec-15-02)에서 CSRF double-submit 방어를 `apps/api` 에 배선했다. 보호 대상은 인증 endpoint(signin/signup/refresh/signout)뿐 아니라 **미인증 상태변경 endpoint**(password-reset·email-verify 계열)도 포함하기로 결정됐다(사용자 합의). `packages/backend/auth-rate-limit/src/csrf.ts` 의 토큰 함수는 `(secret, id)` 시그니처로, 토큰을 임의의 `id` 에 바인딩한다 — 이 `id` 를 무엇으로 둘지가 핵심 결정이었다. session(refresh token)에 묶으면 미인증 요청(session 없음)을 보호할 수 없다.

## 🎯 Decision

CSRF 토큰을 **session 이 아닌 per-client `csrf_id` 쿠키**(httpOnly)에 바인딩한다. `GET /auth/csrf` 가 `csrf_id` 쿠키 + 짝이 되는 토큰을 발급하고, `CsrfGuard` 는 요청의 `csrf_id` 쿠키와 `X-Csrf-Token` 헤더가 동일 secret 으로 검증되는 한 쌍인지만 확인한다(double-submit). signin/signup/refresh 성공 시 토큰을 rotate 하고 body 로 새 `csrfToken` 을 내려 클라이언트가 최신값을 확보한다.

## 📊 Consequences

- **긍정**: 미인증 endpoint(password-reset, email-verify)까지 동일 메커니즘으로 보호. double-submit 보안은 cookie↔header 일치로 성립하므로 session 상태 불요. guard 단위 테스트 용이(session fixture 불필요).
- **부정**: **session-revoke 시 CSRF 토큰 자동 무효화가 안 된다** — `csrf_id` 는 session 수명과 독립. 단, double-submit 모델에서 탈취 위협은 cookie+header 동시 탈취를 요구하므로(동일 출처 정책 하) session 무효화와의 결합도 손실은 수용 가능한 trade-off.
- **중립**: `csrf_id` 는 httpOnly 쿠키라 JS 접근 불가. 토큰 rotate 은 fixation 방지 목적이며 per-request rotation 은 아님(클라 복잡도 회피).

## 🔀 Alternatives

- **session(refresh token) 바인딩**: 토큰을 세션에 묶음 — 비채택 이유: 미인증 상태변경 endpoint(session 없음)를 보호하지 못함. phase-15 적용 범위(인증+미인증)와 배치.
- **Synchronizer token(서버 세션 저장)**: 서버가 토큰을 세션별 저장·대조 — 비채택 이유: 서버 상태 저장 필요, 미인증 흐름엔 세션 자체가 없음. stateless double-submit 대비 인프라 비용↑.
- **Origin/Referer 검증만**: 헤더 기반 — 비채택 이유: 프록시/구형 클라이언트에서 헤더 누락·위조 가능, double-submit 대비 약함. 보조 수단으로는 가능하나 단독 채택 불가.

## 📌 Status

Accepted (2026-06-01, spec-15-02 머지 후 phase-15 회고 시점 작성). 첫 사용처: `apps/api/src/auth/csrf.guard.ts`, `cookie.helper.ts`. secret 출처는 `apps/api/src/settings.ts` 의 `CSRF_SECRET`.

**범위 한계 (후속 이월)**: MFA/passkey 상태변경 POST 8개는 본 결정의 적용 범위 밖(phase-15 회고 W5) — `csrf_id` 메커니즘 자체는 동일하게 적용 가능하나 배선은 후속 spec/icebox. web-vite·`packages/frontend/auth-*` SDK 의 헤더 동반도 후속.

## 🔗 Related

- spec-15-02 (csrf-wiring) — 본 결정의 구현
- `docs/explainers/auth/cookie-strategy.md` — 쿠키 전략 일반
- `docs/review/2026-06-01-wiring-audit.md` §A — CSRF 미배선 갭 발견
- ADR-0014 (auth-security-baseline) — 보안 기준선
- phase-15 회고 W5 (MFA/passkey CSRF 미보호) — 후속 범위
