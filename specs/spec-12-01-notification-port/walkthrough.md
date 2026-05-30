# Walkthrough: spec-12-01

> 이메일/알림 포트 — `@repo/backend-notification` + apps/api 전송 위임.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 전송 추상화 | apps 직접 / core 포트 | **`@repo/backend-notification`** (core) | 어댑터 교체식, framework-agnostic (ADR-0015) |
| 어댑터 | provider 구현 / dev+noop | **dev(로그)+noop** | dev 가시성 + 비-dev 토큰 미로깅. Resend/SES 는 후속 |
| apps/api 분기 | 항상 dev / NODE_ENV | **NODE_ENV: dev→로그, 그 외→noop** | spec-x 보안 속성(비-dev 토큰 미로깅) 보존 |
| DI | 모듈별 / @Global | **@Global NotificationModule** | AuthModule 서비스가 주입 |

### ADR 승격
- [x] 후보: `notification-port` (convention) — 머지 시 검토.

## 💬 사용자 협의
- phase-12 첫 spec. spec-x(토큰 평문 로깅) 핫픽스의 근본 원인을 닫음 — dev console stub → 교체식 전송 포트.

## 🧪 검증 결과

### 단위
- `@repo/backend-notification` ✅ 3 passed (dev sink / noop)
- apps/api auth ✅ 8 passed (password-reset/email-verify 서비스 + secure-token-logging 재작성)

### secure-token-logging 재작성
- 기존: dev console.info(token) / 비-dev 미로깅. 변경 후: 서비스는 console 직접 로깅 안 함 → **notifier.sendEmail 로 위임** + console 에 raw 토큰 미출현 검증.

## 🔍 발견 사항
- **생성기 갭**: spec-10-02 생성기가 backend 패키지 tsconfig 에 `types:["node"]` 를 안 넣어, node 전역(console) 사용 시 TS2584. notification tsconfig 직접 보정 + queue Icebox 등록(생성기 템플릿 수정 후속).
- **commit granularity 일탈**: 이전 staging 잔여로 apps/api 배선이 `feat: implement notification port` 커밋(9d29d32)에 함께 포함됨 (One-Task-One-Commit 경미 일탈, 작업·테스트 정상).

## 🚧 이월 항목
- Resend/SES 실제 provider 어댑터 (인터페이스만 구현됨).
- 생성기 backend/nestjs tsconfig `types:["node"]` 추가 (Icebox).
- queue/worker(12-02), caching(12-03), graceful shutdown(12-04).

## 🔗 관련
- 관련 phase: `backlog/phase-12.md` (§성공 기준 1, §시나리오 1)
- 대체: spec-x-secure-reset-token-logging (임시 stub → 포트)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 최종 commit | ship 시 갱신 |
