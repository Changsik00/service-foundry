# Walkthrough: spec-12-04

> Graceful Shutdown + Lifecycle — `@repo/backend-lifecycle` + apps/api readiness/drain.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| lifecycle 위치 | apps 직접 / core | **`@repo/backend-lifecycle`** | 재사용 + 로직 단위 테스트 |
| readiness vs liveness | 단일 /health / 분리 | **분리** (`/health/live`·`/health/ready`) | k8s probe — 종료 시 트래픽 차단 타이밍 제어 |
| 차단 순서 | 정리 먼저 / readiness 먼저 | **readiness=false 먼저** | LB 가 먼저 트래픽 차단 후 드레인 |
| 행 방지 | 무한 대기 / 타임아웃 | **shutdown timeoutMs** | 멈춘 훅에도 종료 보장 |

### ADR 승격
- [x] 없음 (포트+앱 배선 — phase-12 패턴)

## 💬 사용자 협의
- phase-12 마지막 spec. 머지 시 4 spec 완료 → phase-12 ship.

## 🧪 검증 결과

### 단위
- `@repo/backend-lifecycle` ✅ 5 passed — readiness/setReady, onShutdown 실행, idempotent, **타임아웃 resolve(행 방지)**
- apps/api health ✅ 4 passed — health ok / live 항상 / ready 200·not-ready 503

### 정적
- apps/api typecheck ✅

### 수동 검증 경로
1. 부트 → `/health/ready` 200 → SIGTERM → readiness=false(`/ready` 503) → app.close 드레인 → exit

## 🔍 발견 사항
- readiness 코어를 core 패키지로 분리해 NestJS 없이 단위 테스트 — health controller 는 real lifecycle 주입으로 검증(모킹 불필요).
- backend tsconfig `types:["node"]` 보정(생성기 갭, 반복 — 생성기 수정 Icebox 유효).

## 🚧 이월 항목
- in-flight 요청 카운팅 정밀 드레인 → 후속.
- k8s probe manifest → phase-15(CI/CD).
- nestjs-lifecycle 어댑터 패키지 → 후속.

## 🔗 관련
- 관련 phase: `backlog/phase-12.md` (§성공 기준 4)
- 직전 spec: spec-12-03 (caching)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 최종 commit | ship 시 갱신 |
