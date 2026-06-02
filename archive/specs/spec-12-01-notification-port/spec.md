# spec-12-01: 이메일/알림 포트 (`@repo/backend-notification`)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-12-01` |
| **Phase** | `phase-12` |
| **Branch** | `spec-12-01-notification-port` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no (단위 + apps/api 테스트로 검증) |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
password-reset / email-verify 는 이메일 전송 수단이 없어, spec-x 핫픽스에서 **dev 에서만 토큰을 `console.info`** 하는 임시 stub 상태다. 전송 추상화가 없어 prod 에서 reset/verify 메일을 실제로 보낼 경로가 없다.

### 문제점
- 이메일/알림 전송 포트 부재 → 인증 플로우가 dev console 로깅에 의존.
- provider(Resend/SES) 교체 가능한 추상화가 없어 prod 배선 불가.

### 해결 방안 (요약)
`@repo/backend-notification`(core) 에 **`Notifier` 포트** + **dev 어댑터(로그)** + **noop 어댑터**(비-dev 기본)를 제공. password-reset/email-verify 서비스가 `notifier.sendEmail(...)` 로 reset/verify 메일을 전송하도록 변경 — spec-x 의 dev-gated `console.info(token)` 을 포트 경로로 대체. dev 어댑터는 메일을 로그(가시성 유지), 비-dev 는 noop(토큰 미로깅 — 보안 속성 보존). prod 실제 어댑터(Resend/SES)는 인터페이스 뒤 **후속**.

## 🎯 요구사항

### Functional Requirements
1. `@repo/backend-notification` — `Notifier` 포트(`sendEmail(EmailMessage): Promise<void>`) + `createDevNotifier(sink?)`(로그/sink) + `createNoopNotifier()`.
2. dev 어댑터: 주입 가능한 sink(기본 console.info)로 메일 출력 → 단위 테스트로 sink 호출/내용 검증.
3. password-reset / email-verify 서비스가 `Notifier` 를 주입받아 reset/verify 메일 전송 (토큰 링크 포함). 직접 `console.info(token)` 제거.
4. apps/api: `NODE_ENV==="development"` → dev 어댑터, 그 외 → noop 어댑터 (보안: 비-dev 토큰 미로깅 유지).
5. 포트는 framework-agnostic (core, ADR-0015). prod provider 어댑터는 인터페이스만 — 구현은 후속.

### Non-Functional Requirements
1. 비-dev 환경에서 토큰/시크릿이 로그에 남지 않는다 (spec-x 보안 속성 회귀 없음).
2. 신규 외부 런타임 의존 0 (dev/noop 어댑터는 표준 라이브러리). Resend/SES SDK 는 후속.

## 🚫 Out of Scope
- **Resend/SES 등 실제 provider 어댑터 구현** — 인터페이스/배선만, 구현은 후속.
- SMS/push 등 이메일 외 채널.
- 템플릿 엔진(HTML 메일) — 본 spec 은 text 메일.
- queue/worker(12-02), caching(12-03), graceful shutdown(12-04).

## 📑 ADR 후보
- [x] 있음 → `notification-port` (convention/decision) — 어댑터 교체식 전송 포트. 머지 시점 검토.
- [ ] 없음

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-12.md` (§성공 기준 1, §시나리오 1)
- 관련 spec: spec-x-secure-reset-token-logging (이 spec 이 임시 stub 을 대체)
- 관련 ADR: ADR-0015 (core/adapter)

## ✅ Definition of Done
- [ ] `@repo/backend-notification` 포트 + dev/noop 어댑터 단위 테스트 PASS
- [ ] password-reset/email-verify 가 포트로 전송 (console.info(token) 제거) + 테스트 갱신
- [ ] 비-dev 토큰 미로깅 회귀 없음 (secure-token-logging 테스트 갱신/유지)
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-12-runtime`)
- [ ] 사용자 알림
