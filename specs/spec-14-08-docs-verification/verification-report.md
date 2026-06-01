# 검증 리포트: spec-14-08 지식베이스 문서 환각 전수 검증

> spec-14-07 산출 문서를 실제 소스와 대조해 환각을 탐지·수정한 결과.
> 방식: Sonnet 서브에이전트 3개 도메인 대조 검증 + 수정 → **Opus(메인) grep 스포트체크** 재검증.

## 1. 검증 범위 / 결과 요약

| 영역 | 검증 | 수정 | 비고 |
|---|---|---|---|
| reference 패키지 (48) | 48 | 9 | export 표·시그니처·의존·경로 대조 |
| reference 앱 (4) + architecture + stack | 6 | 2 | 조립 패키지·의존 그래프·버전 |
| explainer auth (12) | 12 | 8 | 동작·mermaid·이벤트명·컬럼명 |
| explainer backend (11) | 11 | 2 | 호출 순서·모듈 패턴·경로 |
| 패키지/앱 README (52) | 52 | 6 | import·시그니처·버전 (reference 수정 전파) |
| **합계** | **123** | **27** | docs-lint 회귀 0 |

## 2. 주요 환각 수정 (대표)

| 문서 | 환각 → 수정 | 검증근거 |
|---|---|---|
| explainer/cookie-strategy | **CSRF 쿠키가 signin/refresh 에 배선됨(거짓)** → "패키지 구현됐으나 미배선" | `grep csrf apps/api/src/auth/` 결과 없음 |
| explainer/mfa-totp-challenge | `pending` 컬럼·`verifyMfaChallengeToken`(미존재) → `enabled` 컬럼·`verifyAccessToken(aud=mfa_challenge)` | `apps/api/src/auth/mfa.stores.ts:enabled` |
| explainer/audit-event-bus | 이벤트명 `LOGIN_SUCCESS/LOGOUT`·`subscribe()` → `SIGNED_IN/SIGNED_OUT/...`·`on()/off()` | `auth-audit/src/audit.service.ts`, `event-bus.ts` |
| explainer/oauth-pkce-flow | `randomBytes(16)` → `randomBytes(32)` | `auth-oauth/src/state.ts:4` |
| explainer/password-reset·email-verify | mermaid `DELETE token` → `markUsed(tokenId, usedAt)` | `*.service.ts:tokenStore.markUsed` |
| explainer/drizzle-migrations | `useFactory` 패턴·`src/db/schema` → `OnModuleDestroy` 직접·`src/infra/schema` | `nestjs/database/src/index.ts:25` |
| reference/nestjs-auth | `forRoot({ secret })` → `forRoot({ keyStore, issuer, audience })` | `nestjs/auth/src/auth.guard.ts:16` |
| reference/backend-auth-jwt | export 8개 누락 추가(FakeKeyStore 등) | `auth-jwt/src/index.ts` |
| reference/backend-cache·idempotency·queue | 시그니처 오류(getOrSet 누락, cache 인자, positional) | 각 `src/` |
| reference/frontend-auth-react | `useSession(): Session\|null` → `Pick<.,"user"\|"isLoading">` | `frontend/auth-react/src/hooks.ts:12` |
| reference/apps/web-vite | Vite 7 → Vite 8 | `pnpm-workspace.yaml` catalog `^8.0.13` |
| reference/architecture | explainer 경로 `auth/auth-sdk-provider-adapters` → `frontend/...` | `ls docs/explainers/` |

## 3. Opus 스포트체크 (서브에이전트 허위검증 차단)

메인(Opus)이 서브에이전트 "확인함" 주장을 grep 으로 표본 11건 재검증 — **전부 일치, 허위검증 0**:
- cookie-strategy CSRF 부재(✓), mfa `enabled`(✓), oauth `randomBytes(32)`(✓), audit 이벤트명·`on/off`(✓), drizzle `src/infra/schema`·`OnModuleDestroy`(✓), nestjs-auth `keyStore`(✓), cache `getOrSet`(✓), jwt `FakeKeyStore`(✓), `useSession` 반환(✓).

→ 서브에이전트 검증 신뢰 가능 판정.

## 4. 🔒 소스 이슈 (문서 아님 — 실제 코드 결함)

| 이슈 | 위치 | 내용 | 조치 |
|---|---|---|---|
| **CSRF 미배선** | `apps/api/src/auth/auth.controller.ts`, `cookie.helper.ts` | `auth-rate-limit/src/csrf.ts` 의 `issueCsrfToken`/`verifyCsrfToken` 가 구현됐으나 refresh endpoint 에 배선 안 됨. SameSite=Lax 단독은 서브도메인 공격 시 refresh rotation 이 CSRF 노출. | **코드 미수정**(docs spec 범위 외). Icebox 기록 → 별도 fix spec 후보. cookie-strategy explainer 의 과장은 본 spec 에서 수정함. |

> 그 외 소스 이슈: 없음. 발견된 나머지 불일치는 전부 문서 오류였다.

## 5. 결론

- spec-14-07 의 LLM 대량 저술 문서에서 **27건 환각/불일치를 탐지·수정**, docs-lint 회귀 0.
- Opus 스포트체크로 서브에이전트 검증 신뢰성 확인 (허위검증 0).
- 부수 성과: **실제 보안 결함(CSRF 미배선) 1건 발견** → Icebox 등록.
- 지식베이스 문서는 이제 소스와 정합 → main 승격(phase-ship) 적격.
