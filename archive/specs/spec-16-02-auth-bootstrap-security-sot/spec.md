# spec-16-02: 부트스트랩 보안 배선 SoT (applySecurity → configureApp 흡수)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-16-02` |
| **Phase** | `phase-16` |
| **Branch** | `spec-16-02-auth-bootstrap-security-sot` |
| **상태** | Planning |
| **타입** | Fix (배선 회귀 안전망) |
| **Integration Test Required** | yes (e2e 보안헤더 검증) |
| **작성일** | 2026-06-02 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
phase-15 C1 보완으로 미들웨어 배선(`requestIdMiddleware` + `cookieParser`)을 `apps/api/src/app.setup.ts` 의 `configureApp(app)` SoT 로 추출했고, main.ts·e2e 가 이를 공유해 **배선 제거 시 prod·test 동시 실패**한다(회귀 안전망).

그러나 `main.ts:26` 의 **`applySecurity(app, { cors })`(helmet + CORS)는 configureApp 밖에 남아 있다.** e2e 의 `beforeAll` 은 `configureApp(app)` 만 호출하므로 **helmet/CORS 는 e2e 에서 전혀 검증되지 않는다** — main.ts 에서 `applySecurity` 한 줄을 지워도 모든 테스트가 GREEN (phase-15 2차회고 V1, C1 과 동일 계열 갭).

### 문제점
- 보안헤더(helmet) 배선이 회귀 안전망 밖 — 실수로 제거/변경돼도 CI 가 못 잡는다.
- phase-16 성공기준2 미충족. RCA-003(배선 검증) Invariant("배선 제거 시 실패하는 테스트") 의 정신과 배치.

### 해결 방안 (요약)
`configureApp` 가 `applySecurity`(helmet + cors)까지 흡수한다. CORS origin 은 settings 의존이므로 `configureApp(app, opts?: { corsOrigin })` 로 옵션을 받아 main.ts 가 `settings.CORS_ORIGIN` 을 주입한다. e2e 는 `configureApp(app)`(cors origin 생략 → 테스트 기본) 으로 helmet 헤더를 받게 되고, 신규 e2e 가 helmet 헤더 존재를 검증한다 — **configureApp 에서 applySecurity 제거 시 e2e FAIL**.

## 🎯 요구사항

### Functional Requirements
1. `configureApp(app, opts?)` 가 requestId + cookieParser + applySecurity(helmet + cors)를 단일 경로로 배선.
2. main.ts 가 `configureApp(app, { corsOrigin: settings.CORS_ORIGIN })` 로 호출 — 기존 CORS 동작(origin + credentials) 보존.
3. e2e 가 helmet 헤더(예: `x-content-type-options: nosniff`) 존재를 검증 — applySecurity 제거 시 FAIL.

### Non-Functional Requirements
1. helmet/CORS 동작값 불변 (기존 `{ origin, credentials: true }`).
2. 미들웨어 등록 순서: requestId(최앞단) → cookieParser → security. reqId 컨텍스트 보존.

## 🚫 Out of Scope
- BackendThrottlerModule(전역 rate-limit) 변경 — 본 spec 무관.
- CSP 등 helmet 세부 정책 튜닝 — 기본값 유지.
- prod 시크릿 가드(W3) — phase-FF 별도.

## 📑 ADR 후보
- [x] 없음 (C1 의 configureApp 패턴 확장, 신규 결정 없음)

## 🔗 관련 문서 (Related)
- 관련 RCA: [[RCA-003]] (배선 검증 패턴)
- 관련: phase-15 2차회고 V1, `apps/api/src/app.setup.ts`(C1)

## ✅ Definition of Done
- [ ] `configureApp` 가 applySecurity 흡수, main.ts corsOrigin 주입
- [ ] e2e helmet 헤더 검증 (제거 시 FAIL 대조 확인)
- [ ] walkthrough/pr_description ship + push + PR (base: phase-16-security-hardening)
- [ ] 사용자 검토 알림
