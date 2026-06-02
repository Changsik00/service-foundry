# phase-16: Security Hardening II

> phase-15(Security & Wiring Hardening) 회고에서 이월된 보안 후속을 마무리한다.
> phase-15 는 "구현됐으나 미배선"을 배선했고, 본 phase 는 그 배선의 **잔여 공격면·회귀 안전망·prod 가드**를 닫는다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-16` |
| **상태** | Planning |
| **시작일** | 2026-06-02 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | phase-16-security-hardening |

## 🎯 배경 및 목표

### 현재 상황
phase-15 에서 CSRF·rate-limit·CI 게이트·request-id 를 배선했고, 2회 회고(1차 + 2차 재검증)로 C1(배선 회귀 안전망)을 보강했다. 그 과정에서 **의도적으로 이월한 보안 갭**이 누적됐다 (회고 W3/W5/W6 + 2차회고 V1/V2 + 정리 W4):

- **W5**: MFA/passkey 상태변경 POST 8개가 CSRF 미보호 — 특히 `mfa/totp/verify`·`passkey/authenticate/verify` 는 미인증 로그인 완료 endpoint.
- **V1**: `configureApp` SoT 가 `applySecurity`(helmet/CORS) 미포함 → 보안헤더 배선이 e2e 미검증(C1 과 동일 계열 갭).
- **W3**: `CSRF_SECRET`·`OAUTH_STATE_SECRET` 이 `NODE_ENV=production` 에서도 dev 기본값 통과.
- **W6**: web-next 가 CSRF 403(토큰 만료/불일치) 시 자가복구 없음 + web-vite/SDK 헤더 미동반.
- **V2/W4**: csrf.ts 주석이 폐기된 session-binding 전략 설명(ADR-0021 모순) / knip redundant ignore 잔재.

### 목표 (Goal)
phase-15 가 연 보안 배선의 **잔여 공격면을 닫고**, 배선 회귀 안전망을 보안헤더까지 확장하며, production 기동 시 약한 시크릿을 거부한다. CSRF 메커니즘은 ADR-0021(csrf_id, session 비의존)을 그대로 재사용한다.

### 성공 기준 (Success Criteria) — 정량 우선
1. **MFA/passkey CSRF** — `mfa/totp/{enroll,enroll/confirm,verify,disable}` + `passkey/{register,authenticate}/{options,verify}` 8개가 CSRF 검증 미통과 시 거부(403). 우회 차단 e2e.
2. **보안헤더 배선 SoT** — `applySecurity`(helmet/CORS)가 `configureApp` 에 흡수되어 prod·e2e 가 동일 경로. **제거 시 e2e 보안헤더 검증 FAIL**(배선 회귀 차단, C1 패턴 확장).
3. **prod 시크릿 가드** — `NODE_ENV=production` + `CSRF_SECRET`/`OAUTH_STATE_SECRET` 이 dev 기본값이면 기동 거부(단위 테스트로 throw 확인).
4. **web-next CSRF 자가복구** — 403 응답 시 csrf 재부트스트랩+재시도로 복구(테스트). web-vite/SDK 가 CSRF 헤더 동반.
5. **주석/설정 정합** — csrf.ts 주석이 ADR-0021(csrf_id)와 일치. knip redundant ignore 0(배선 완료 dep ignore 제거).

## 🧩 작업 단위 (SPEC + phase-FF)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-16-01` | mfa-passkey-csrf | P? | Merged | `specs/spec-16-01-mfa-passkey-csrf/` |
| `spec-16-02` | auth-bootstrap-security-sot | P? | Merged | `specs/spec-16-02-auth-bootstrap-security-sot/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

> **실행 순서**: 백엔드 보안 갭(16-01·16-02) 먼저, 그 다음 prod 가드·프론트(16-03). 정리(V2/W4)는 phase-FF.

### spec-16-01 — mfa-passkey-csrf (W5)
- **요점**: MFA/passkey 상태변경 POST 8개에 `CsrfGuard` 배선.
- **방향성**: ADR-0021 의 csrf_id double-submit 메커니즘 재사용(이미 `CsrfGuard` 존재). 미인증 endpoint(`verify`·`authenticate`) 포함이라 session 비의존 binding 그대로 적합. e2e 로 헤더 누락 → 403, 동반 → 정상 확인. 프론트(web-next) 동반 헤더는 W6(16-03)에서.
- **참조**: ADR-0021, phase-15 회고 W5, `docs/review/2026-06-01-wiring-audit.md`
- **연관 모듈**: `apps/api/src/auth/mfa.controller.ts`, `passkey.controller.ts`

### spec-16-02 — auth-bootstrap-security-sot (V1)
- **요점**: `applySecurity`(helmet/CORS)를 `configureApp` SoT 에 흡수 + e2e 보안헤더 검증 추가.
- **방향성**: phase-15 C1 의 `configureApp` 패턴 확장 — main.ts·e2e 가 동일 함수로 helmet/CORS 까지 배선. 제거 시 e2e FAIL(회귀 차단). CORS origin 은 settings 주입 유지(테스트 기본값 처리).
- **참조**: phase-15 2차회고 V1, RCA-003(배선 검증 패턴), `apps/api/src/app.setup.ts`
- **연관 모듈**: `apps/api/src/app.setup.ts`, `main.ts`, `auth.e2e.test.ts`, `packages/nestjs/security`

### spec-16-03 — web-csrf-resilience (W6)
- **요점**: web-next CSRF 403 자가복구(재부트스트랩+재시도) + MFA/passkey 헤더 동반 + (가능 시) web-vite/SDK 헤더.
- **방향성**: `auth-api.ts` 인터셉터에 403→`GET /auth/csrf` 재발급→1회 재시도. 16-01 로 보호된 MFA/passkey 호출에 X-Csrf-Token 동반. 무한루프 가드.
- **참조**: phase-15 회고 W6, ADR-0021
- **연관 모듈**: `apps/web-next/src/lib/auth-api.ts`, `packages/frontend/auth-*`

### phase-FF 예정 항목 (spec 미생성)

> 작고 가역적인 항목 — phase base 브랜치 직접 커밋(phase-FF, → ADR-004). 착수 시 크기 재확인, 커지면 SPEC 승격.

| 항목 | 요점 | 상태 |
|---|---|:---:|
| W3 prod 시크릿 가드 | settings.ts build: prod + dev 기본 CSRF/OAUTH 시크릿 → 기동 거부 + 단위 4 PASS | ✅ a748359 |
| V2 csrf.ts 주석 정정 | session-binding 설명 → csrf_id(ADR-0021) 동기화 | ✅ 1b681e1 |
| W4 knip ignore 정리 | 배선 완료 `@repo/backend-auth-rate-limit` ignore 제거 (undici 유지) | ✅ 8a16ce5 |

> W3 는 가드 로직 + 테스트라 1~2 commit 이나 단일 파일(settings)·가역적이라 phase-FF. 착수 시 e2e 영향 크면 SPEC 승격 재고.

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| CSRF 메커니즘 | 신규 / ADR-0021 재사용 | **ADR-0021 재사용** | csrf_id double-submit 이 미인증 endpoint 까지 커버 — MFA/passkey verify 가 미인증이라 그대로 적합 |
| W3 모드 | spec / phase-FF | **phase-FF** | 단일 파일(settings)·가역적. 단 prod 기동 거부라 테스트 필수 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: MFA verify CSRF 우회 차단
- **Given**: signin → mfa_required + mfaChallengeToken.
- **When**: CSRF 헤더 없이 `POST /auth/mfa/totp/verify`.
- **Then**: 403. 올바른 csrf 동반 시 정상(200).
- **연관 SPEC**: spec-16-01

### 시나리오 2: 보안헤더 배선 회귀 차단
- **Given**: `configureApp` 가 applySecurity 흡수.
- **When**: e2e 가 helmet 헤더(예: `x-content-type-options`) 존재 확인.
- **Then**: 존재. configureApp 에서 applySecurity 제거 시 해당 e2e FAIL.
- **연관 SPEC**: spec-16-02

### 시나리오 3: prod 약한 시크릿 기동 거부
- **Given**: `NODE_ENV=production`, `CSRF_SECRET=dev-secret-change-in-production`.
- **When**: `loadSettings` 호출.
- **Then**: throw(기동 거부). 강한 시크릿이면 통과.
- **연관 SPEC**: phase-FF(W3)

## 🔗 의존성
- **선행 phase**: phase-15 (CSRF/rate-limit/request-id 배선, ADR-0021).
- **연관 ADR**: ADR-0021(csrf-binding), ADR-0014(auth-security-baseline), RCA-003(배선 검증).
- **연관 문서**: `docs/review/2026-06-01-wiring-audit.md`, phase-15 회고(`backlog/phase-15.md` → archive).

## 📝 위험 요소 및 완화
| 위험 | 영향 | 완화책 |
|---|---|---|
| MFA/passkey CSRF 배선이 기존 e2e(MFA 슬라이스) 깨뜨림 | CI red | 16-01 에서 e2e 의 MFA/passkey 호출에 csrf 동반 동시 갱신 |
| applySecurity 흡수가 CORS/helmet 동작 변경 | 회귀 | 기존 설정값 유지 + e2e 헤더 검증으로 고정 |
| prod 가드가 로컬/테스트 기동 막음 | DX | `NODE_ENV=production` 한정 — dev/test 는 기본값 허용 |

## 🏁 Phase Done 조건
- [ ] 모든 SPEC merge (phase-16-security-hardening → main)
- [ ] 통합 시나리오 3개 PASS
- [ ] 성공 기준 5개 정량 측정 기록
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값 -->
