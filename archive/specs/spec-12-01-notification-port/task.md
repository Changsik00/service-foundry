# Task List: spec-12-01

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-12.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + notification 포트 (TDD)

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-12-01-notification-port` (from `phase-12-runtime` 부재 시 main — 첫 spec, ship 시 base JIT)

### 1-2. 포트 scaffold + 테스트 (Red, throwing 스텁)
- [x] `pnpm new package notification backend` (생성기 dogfood) — `@repo/backend-notification`
- [x] `src/index.ts` throwing 스텁 + `src/index.test.ts`
- [x] Fail → Commit: `test(spec-12-01): add failing tests for notification port`

### 1-3. 포트 구현 (Green)
- [x] `src/index.ts` — dev(sink)/noop 어댑터
- [x] Pass (3/3) → Commit: `feat(spec-12-01): implement notification port (dev/noop adapters)`

---

## Task 2: apps/api 배선 — 서비스가 포트로 전송

### 2-1. provider + 서비스 wiring + 테스트 갱신
- [x] `apps/api` dep + `notifier.provider.ts`(NODE_ENV 분기) + `@Global NotificationModule`
- [x] password-reset/email-verify — Notifier 주입, `console.info(token)` 제거 → `notifier.sendEmail`
- [x] 테스트 갱신: 서비스 테스트 NOTIFIER mock + secure-token-logging 재작성(포트 위임 검증)
- [x] typecheck + 관련 테스트 18/18 PASS
- [x] Commit: (※ staging 잔여로 9d29d32 Green 커밋에 함께 포함 — One-Task-One-Commit 경미 일탈)
- [x] 발견: 생성기(backend tsconfig)가 `types:["node"]` 누락 → console 미해결. notification tsconfig 직접 보정. **생성기 갭 = 후속**

---

## Task 3: Ship
- [x] 단위 notification(3) + apps/api auth(8) PASS
- [x] typecheck
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-12-01): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-12-runtime`)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 3 (작업 2 + Ship) |
| 예상 commit | test 1 + feat 2 + ship 1 |
| 현재 단계 | Planning |
