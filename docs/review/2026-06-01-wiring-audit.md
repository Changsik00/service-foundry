---
type: reference
aliases: [배선 감사, wiring audit, 미완성 코드 조사]
tags: [service-foundry, reference, platform, audit]
---

# Wiring Audit — 구현됐으나 미배선/미완 코드 전수 조사 (2026-06-01)

> 💡 **한 줄 요약**: spec-14-08 문서 검증 중 발견된 CSRF 미배선이 단발인지 확인하기 위해 코드 전수 조사. **CSRF 외 다수 갭 확인** — phase-15(Security & Wiring Hardening)의 근거.
> **방식**: Sonnet 서브에이전트 3개(backend/api · frontend/nestjs · shared/tooling/config) grep 기반 전수 → Opus 스포트체크.
> **갭 기준**: "안 하면 보안 위험 / 적합성(success criterion) 깨짐"만 🔴 진짜 갭. UI 부재·RBAC 미사용·provider 교체점은 **YAGNI 면제 보일러플레이트의 의도적 미배선**으로 간주(🟡).

## 🔴 진짜 갭 (보안·검증) — phase-15 대상

| # | 갭 | 위치 | 근거 (grep 검증) | 분류 |
|---|---|---|---|---|
| A | **CSRF 미배선** | `apps/api/src/auth/auth.controller.ts` | `csrf.ts` 의 `issueCsrfToken`/`verifyCsrfToken` 구현됐으나 controller import 0, refresh endpoint 무검증 | 보안 |
| B | **로그인 rate-limit + lockout 미배선** | `apps/api` (SigninService) | `checkRateLimit`/`recordFailure`/`evaluateLockout` apps 호출 0, `failed_logins`/`lockouts` 테이블 appSchema 누락 → **brute-force 무방비** | 보안 |
| C | **CI knip/depcruise 누락** | `.github/workflows/verify.yml` | `lint typecheck test build` 만 실행, knip/depcruise 문자열 0. **phase-14 성공기준5 부분 미충족** (turbo task·root script 에도 없음) | 검증 게이트 |
| D | **requestIdMiddleware 미배선** | `apps/api/src/main.ts` | `requestIdMiddleware` apps 사용 0 → AsyncLocalStorage 컨텍스트 없음 → 모든 로그 `reqId` undefined, http-client `X-Request-Id` 전파 무효 | 관측성 |
| E | **생성기 backend tsconfig `types:["node"]` 누락** | `turbo/generators/lib/templates.ts:114` | `category==="shared" ? {lib} : undefined` — backend 는 `TS_BASE`(types 없음) extends → 신규 backend 패키지 scaffold 시 console/process 쓰면 TS2584. 기존 패키지는 수동 우회 중 | 검증/DX |

## 🟡 의도적 미배선 (보일러플레이트 — Icebox 유지)

| 항목 | 위치 | 판단 근거 |
|---|---|---|
| Passkey env 무시 + rpName 하드코딩 | `passkey.service.ts:27-29` | issuer 파싱으로 동작은 함. env 미사용은 개선거리지만 보안 갭 아님 |
| HttpClient/Settings Module DI 미주입 | `apps/api/app.module.ts` | 등록만, 소비 0. 불필요 초기화지만 위험 아님 — cleanup |
| web-vite ThemeToggle no-op | `web-vite/main.tsx` | next-themes vs frontend-ui 컨텍스트 불일치 → 토글 무효. UX 버그(보안 아님) |
| 프론트 MFA/Passkey UI 부재 | apps/web-* | API/훅 준비됐으나 UI 없음 — 보일러플레이트 의도적 |
| RequireAuth/RequireRole 미사용 | apps/web-* | 가드 구현됐으나 라우트 미적용 — 데모 단계 의도적 |
| outbox/idempotency/cache/storage/secrets 미배선 | apps | 포트만, 어댑터 미주입. 주석에 "후속 spec" 명시 — 의도적 |
| notification noop (실 이메일 어댑터 없음) | `notifier.provider.ts` | 주석 "Resend/SES 후속" — 의도적 |
| worker lifecycle 미사용 | `worker/main.ts` | 주석 "spec-12-04 정식" — 의도적 |

## ⚪ Cleanup 후보 (knip 류)

- `RolesGuard`/`@Roles` 미사용 · `needsRehash` 미호출 · `createFakeKeyStore` 공개 export · `createTracingSdk`/`createApiClient` 미사용
- `@repo/tsup-config` dead (어떤 backend 도 tsup.config.ts 없음 — 전부 src 직접 export) · `node-app.json` dead preset
- `packages/shared/factory/tsconfig.json` 만 `lib` 인라인 누락 (불일치)
- → C(knip CI 배선) 가 들어가면 이들이 자동 표면화됨

## 결론

- CSRF 는 **단발이 아니었다.** 같은 "구현 후 미배선" 패턴이 보안 2건(CSRF, rate-limit) + 검증 게이트 1건(knip/depcruise) + 관측성 1건(reqId) + 생성기 1건으로 확인됨.
- 가장 심각: **B(brute-force 무방비)** — rate-limit 패키지가 100% 구현·DB 스키마·마이그레이션까지 있는데 SigninService 가 호출 안 함.
- **C 는 phase-14 phase-ship 검증 누락** — 에이전트가 성공기준5 의 knip/depcruise 부분을 놓치고 PASS 판정함 (→ RCA 후보: phase-ship 성공기준 문자 단위 대조 누락).
- 의도적 미배선(🟡)은 보일러플레이트 철학상 정상 — phase-15 범위에서 제외.
