# phase-15: Security & Wiring Hardening

> 구현됐으나 배선되지 않은 보안·검증 기능을 실제 동작 경로에 연결한다.
> 근거: spec-14-08 문서 검증 중 CSRF 미배선 발견 → 전수 조사([[2026-06-01-wiring-audit]])로 같은 패턴 5건 확인.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-15` |
| **상태** | Planning |
| **시작일** | 2026-06-01 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-15-security-wiring` |

## 🎯 배경 및 목표

### 현재 상황
이 보일러플레이트는 "YAGNI 면제" 철학으로 기능을 미리 깔아두는데, 그 결과 **패키지에 100% 구현됐으나 앱 동작 경로에 배선 안 된** 기능이 누적됐다. spec-14-08(문서 환각 검증)에서 CSRF 미배선을 우연히 발견했고, 단발 여부를 확인하려 전수 조사한 결과 보안·검증 영역에서 **5건의 진짜 갭**이 확인됐다 (`docs/review/2026-06-01-wiring-audit.md`).

UI 부재·RBAC 미사용·provider 교체점 등은 보일러플레이트의 *의도적* 미배선이라 제외하고, **"안 하면 보안 위험 / 적합성(success criterion) 깨짐"** 인 것만 본 phase 대상으로 한다.

### 목표 (Goal)
구현 완료된 보안·검증 기능(CSRF, 로그인 rate-limit/lockout, CI dead-code/boundary 게이트, request-id 추적, 생성기 정합성)을 실제 동작 경로에 배선하여, "코드는 있는데 안 돌던" 상태를 해소한다.

### 성공 기준 (Success Criteria) — 정량 우선
1. **CSRF 배선** — refresh(및 상태변경) endpoint 가 `verifyCsrfToken` 통과 못 하면 거부. double-submit 흐름 e2e 테스트.
2. **로그인 rate-limit + lockout 배선** — `failed_logins`/`lockouts` 테이블 appSchema 포함 + 마이그레이션, SigninService 가 `checkRateLimit`/`recordFailure`/`recordSuccess`/`evaluateLockout` 호출. N회 실패 → lockout 회귀 테스트.
3. **CI knip + depcruise 게이트** — `verify.yml` 이 knip + dependency-cruiser 를 실제 실행, 위반 시 red. (phase-14 성공기준5 의 미충족분 완성.)
4. **request-id 배선** — `apps/api/main.ts` 가 `requestIdMiddleware` 적용, 로그에 `reqId` 채워짐(통합 테스트로 비-undefined 확인).
5. **생성기 tsconfig 정합** — `pnpm new package`(backend) 가 `types:["node"]` 포함 tsconfig 생성, 신규 패키지가 console/process 사용해도 typecheck PASS.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| `spec-15-01` | ci-knip-depcruise-gate | P? | Merged | `specs/spec-15-01-ci-knip-depcruise-gate/` |
| `spec-15-02` | csrf-wiring | P? | Merged | `specs/spec-15-02-csrf-wiring/` |
| `spec-15-03` | login-ratelimit-lockout | P? | Merged | `specs/spec-15-03-login-ratelimit-lockout/` |
| `spec-15-04` | request-id-wiring | P? | Active | `specs/spec-15-04-request-id-wiring/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

> **실행 순서 = 번호** (CI 게이트 먼저 = 안전망, phase-14 의 14-01 과 동일 논리).

### spec-15-01 — ci-knip-depcruise-gate (우선 — 안전망)
- **요점**: `verify.yml` 에 knip + depcruise 실행 추가 (phase-14 성공기준5 완성). turbo task / root script 정비 + 기존 dead export 정리.
- **방향성**: `pnpm knip`, `pnpm depcruise` script → turbo task → verify.yml step. audit ⚪ 목록(RolesGuard·needsRehash·createApiClient·tsup-config·node-app.json·factory tsconfig 등) 표면화 → 정리 또는 ignore 등록. **나머지 spec 의 dead-code/경계 안전망이라 먼저.**
- **참조**: `docs/review/2026-06-01-wiring-audit.md` §C+⚪ · ADR-0001(boundary)
- **연관 모듈**: `.github/workflows/verify.yml`, `turbo.json`, `package.json`, knip/depcruise config

### spec-15-02 — csrf-wiring
- **요점**: `apps/api` refresh(+상태변경) endpoint 에 CSRF double-submit 검증 배선. signin 성공 시 CSRF 토큰을 cookie+body 발급, 검증 미들웨어/가드 추가.
- **방향성**: `csrf.ts` 의 `issueCsrfToken`/`verifyCsrfToken` 활용. secret 출처는 settings. cookie helper 확장. e2e 로 우회 차단 확인. 프론트(web-next) auth-sdk 동반 갱신 검토.
- **참조**: `docs/review/2026-06-01-wiring-audit.md` §A · `docs/explainers/auth/cookie-strategy.md`
- **연관 모듈**: `apps/api/src/auth/auth.controller.ts`, `cookie.helper.ts`, `packages/backend/auth-rate-limit/src/csrf.ts`

### spec-15-03 — login-ratelimit-lockout
- **요점**: 로그인 brute-force 방어 배선 — `failed_logins`/`lockouts` 테이블 appSchema + 마이그레이션, SigninService 에 rate-limit/lockout 호출.
- **방향성**: `checkRateLimit` → 차단 시 거부, 성공 시 `recordSuccess`, 실패 시 `recordFailure` + `evaluateLockout`. drizzle store 주입. 회귀 테스트(N회 실패 → lock).
- **참조**: `docs/review/2026-06-01-wiring-audit.md` §B · `docs/explainers/auth/auth-rate-limit-lockout.md`
- **연관 모듈**: `apps/api/src/auth/signin.service.ts`, `apps/api/src/infra/schema/`, `packages/backend/auth-rate-limit`

### spec-15-04 — request-id-wiring
- **요점**: `apps/api/main.ts` 에 `requestIdMiddleware` 적용 → 로그 `reqId` 채워짐, http-client `X-Request-Id` 전파 활성.
- **방향성**: 미들웨어 배선 + 통합 테스트로 `reqId` 비-undefined 확인. 작아서 spec-15-05 와 bundle 가능(재검증 §11 에서 판단).
- **참조**: `docs/review/2026-06-01-wiring-audit.md` §D · `docs/explainers/backend/request-id-propagation.md`
- **연관 모듈**: `apps/api/src/main.ts`

### spec-15-05 — generator-tsconfig-fix
- **요점**: 생성기 `tsconfig()` 가 backend 카테고리에 `types:["node"]` 포함하도록 수정 + shared `factory` tsconfig 불일치 정리.
- **방향성**: `library.json` preset 에 `types:["node"]` 추가 또는 템플릿 직접 주입. 생성 후 smoke-test 로 typecheck PASS 확인.
- **참조**: `docs/review/2026-06-01-wiring-audit.md` §E+⚪
- **연관 모듈**: `turbo/generators/lib/templates.ts`, `packages/config/typescript-config/`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 갭 기준 | 전부 / 보안·검증만 | **보안·검증만** | YAGNI 면제 보일러플레이트 — UI/RBAC/provider 교체점은 의도적 미배선 (사용자 결정 2026-06-01) |
| 묶음 단위 | spec-x 산발 / 새 phase | **phase-15** | 5건 응집(배선 테마), 3+ spec → Phase 진입조건 충족 |
| phase 번호 | — | Security=15, deploy=16 | 보안이 더 급함 → deploy/k8s 를 phase-16 으로 밀어냄 (사용자 결정 2026-06-01) |
| CI 갭(§C) 책임 | — | **phase-ship 검증 누락** | 에이전트가 phase-14 성공기준5 의 knip/depcruise 부분을 놓치고 PASS 판정 → RCA 후보(phase-ship 성공기준 문자 단위 대조) |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: CSRF 우회 차단
- **Given**: signin 으로 세션 + CSRF 토큰 발급.
- **When**: CSRF 헤더 없이 `POST /auth/refresh`.
- **Then**: 거부(403). 올바른 토큰 동반 시 200.
- **연관 SPEC**: spec-15-02

### 시나리오 2: 로그인 brute-force lockout
- **Given**: 동일 계정 연속 로그인 실패.
- **When**: 임계치 초과.
- **Then**: lockout → 이후 시도 거부(올바른 비번이어도).
- **연관 SPEC**: spec-15-03

### 시나리오 3: CI 게이트가 dead-code/경계 위반 차단
- **Given**: knip/depcruise 위반 의도 주입한 PR.
- **When**: verify CI.
- **Then**: red → 머지 차단.
- **연관 SPEC**: spec-15-01

## 🔗 의존성
- **선행 phase**: phase-14 (보안 포트·CI 게이트 기반).
- **연관 ADR**: ADR-0001(boundary linter), ADR-0014(auth security baseline), ADR-0013(session).
- **연관 문서**: `docs/review/2026-06-01-wiring-audit.md` (근거 감사).
- **후속**: phase-16 (deploy/k8s manifest).

## 📝 위험 요소 및 완화
| 위험 | 영향 | 완화책 |
|---|---|---|
| CSRF 배선이 기존 web-next 로그인 흐름 깨뜨림 | 회귀 | 프론트 auth-sdk 동반 갱신 또는 점진 적용, e2e 검증 |
| rate-limit 배선이 e2e(반복 로그인) 깨뜨림 | CI red | 테스트용 임계치 설정 + 테스트 격리 |
| knip/depcruise 켜자 기존 위반 다수 표면화 | 일정 | spec-15-03 에서 위반 정리 포함, warn→error 점진 도입 옵션 |

## 🏁 Phase Done 조건
- [ ] 모든 SPEC merge (phase-15-security-wiring → main)
- [ ] 통합 시나리오 3개 PASS
- [ ] 성공 기준 5개 정량 측정 기록
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값 -->
