# Implementation Plan: spec-12-01

## 📋 Branch Strategy
- 신규 브랜치: `spec-12-01-notification-port` (from `phase-12-runtime`)
- base 모드: PR target = `phase-12-runtime` (첫 spec — ship 시 base JIT)

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] notification = **포트 + dev/noop 어댑터만**. Resend/SES 실제 구현은 후속.
> - [ ] apps/api: dev→dev어댑터(로그), 비-dev→noop (토큰 미로깅 보안 유지).
> - [ ] password-reset/email-verify 의 `console.info(token)` 제거 → 포트 호출로 대체.

> [!WARNING]
> - [ ] auth 서비스에 Notifier 주입 추가 → 기존 서비스/컨트롤러 테스트 DI 갱신 필요.
> - [ ] PreToolUse 훅 의존(#161) — add 분리 + bare `git commit`. (notification 메시지에 'token' 단어 → secret 가드 가능 → 필요시 warn)

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 포트 | `@repo/backend-notification` `Notifier.sendEmail` | core, 어댑터 교체 |
| dev 어댑터 | `createDevNotifier(sink=console.info)` | dev 가시성 + sink 로 테스트 |
| noop | `createNoopNotifier()` | 비-dev 기본(토큰 미로깅) |
| apps/api | NOTIFIER provider (NODE_ENV 분기) + 서비스 주입 | spec-x stub 대체 |
| 테스트 | 단위(어댑터 sink) + 서비스(notifier 호출) + secure-token-logging 갱신 | 보안 회귀 방지 |

### 📑 ADR 후보
- [x] `notification-port` — 머지 시 검토.

## 📂 Proposed Changes

### @repo/backend-notification (신규, 생성기 scaffold)
- [NEW] `src/index.ts` — `EmailMessage`, `Notifier`, `createDevNotifier`, `createNoopNotifier`
- [NEW] `src/notifier.test.ts` — dev sink 호출/내용, noop no-op

### apps/api
- [NEW] `src/notification/notifier.provider.ts` — `NOTIFIER` 토큰 + provider(NODE_ENV 분기: dev/noop)
- [MODIFY] `src/app.module.ts` — @Global 또는 provider 등록 (auth 서비스가 주입)
- [MODIFY] `src/auth/password-reset.service.ts` — Notifier 주입, `console.info(token)` → `notifier.sendEmail(reset 링크)`
- [MODIFY] `src/auth/email-verify.service.ts` — 동일
- [MODIFY] 관련 테스트(password-reset.service.test / email-verify.service.test / secure-token-logging.test) — NOTIFIER mock 주입 + 검증 갱신

## 🧪 검증 계획

### 단위
```bash
pnpm --filter @repo/backend-notification test
pnpm --filter @apps/api exec vitest run src/auth/password-reset.service.test.ts src/auth/email-verify.service.test.ts src/auth/secure-token-logging.test.ts
```
dev sink 호출 / 서비스가 notifier 호출 / 비-dev 토큰 미로깅.

### 정적
```bash
pnpm --filter @apps/api typecheck
```

### 수동
1. dev 부트 → reset 요청 → dev 어댑터가 메일(토큰 링크) 로그.
2. 비-dev → noop (로그에 토큰 없음).

## 🔁 Rollback
- 신규 패키지 + apps/api provider + 2 서비스 수정. 서비스의 notifier 호출을 되돌리면 복귀. trace/metric(11) 영향 없음.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
