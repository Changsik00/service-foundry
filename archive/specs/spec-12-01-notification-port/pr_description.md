# feat(spec-12-01): 이메일/알림 포트 (`@repo/backend-notification`)

## 📋 Summary

### 배경 및 목적
password-reset/email-verify 가 spec-x 핫픽스에서 dev console 로 토큰을 찍는 임시 stub 상태였다. 본 spec 은 교체식 전송 포트 `@repo/backend-notification` 을 도입해 그 **근본 원인을 닫는다** — dev console stub → 어댑터 교체식 Notifier.

### 주요 변경
- [x] **`@repo/backend-notification`** (core) — `Notifier` 포트 + `createDevNotifier`(로그/sink) + `createNoopNotifier`
- [x] apps/api `@Global NotificationModule` (NODE_ENV: dev→로그, 그 외→noop)
- [x] password-reset/email-verify 가 `notifier.sendEmail()` 로 전송 — `console.info(token)` 제거
- [x] secure-token-logging 테스트 재작성 (포트 위임 + console 미로깅 검증)

### Phase 컨텍스트
- **Phase**: `phase-12` (Service Foundations I · Runtime) — 첫 spec
- **역할**: 성공 기준 1(notification 포트) 충족 + spec-x 보안 부채 근본 해소.

## 🎯 Key Review Points
1. **core 경계**: 포트는 framework-agnostic. prod provider(Resend/SES)는 인터페이스 뒤 후속.
2. **보안 속성 보존**: 비-dev = noop → 토큰 미로깅 (spec-x 회귀 없음). secure-token-logging 테스트가 강제.
3. **생성기 갭 발견**: backend 패키지 tsconfig `types:["node"]` 누락 → console TS2584. notification 보정 + Icebox 등록.
4. **commit granularity**: apps/api 배선이 `feat: implement` 커밋(9d29d32)에 함께 포함됨 (staging 잔여, 경미 일탈 — walkthrough 기록).

## 🧪 Verification
```bash
pnpm --filter @repo/backend-notification test   # 3 passed
pnpm --filter @apps/api exec vitest run src/auth/{secure-token-logging,password-reset.service,email-verify.service}.test.ts   # 8 passed
```

## 📦 Files Changed
### 🆕 New
- `packages/backend/notification/*` (포트 + dev/noop)
- `apps/api/src/notification/{notifier.provider,notification.module}.ts`
### 🛠 Modified
- `apps/api/src/auth/{password-reset,email-verify}.service.ts` (+notifier, −console.info)
- `app.module.ts` (+NotificationModule), 관련 테스트 3종

## ✅ Definition of Done
- [x] 포트 + dev/noop 단위 PASS
- [x] 서비스 포트 전송 + 테스트 갱신 (console.info(token) 제거)
- [x] 비-dev 토큰 미로깅 회귀 없음
- [x] walkthrough / pr_description ship

## 🔗 관련
- Phase: `backlog/phase-12.md`
- 대체: spec-x-secure-reset-token-logging
- 후속: Resend/SES 어댑터, queue/worker(12-02)
