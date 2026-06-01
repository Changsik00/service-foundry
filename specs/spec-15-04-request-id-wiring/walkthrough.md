# Walkthrough: spec-15-04

> request-id 미들웨어 배선 (apps/api). 작업 기록 + 결정 + 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 적용 형태 | NestJS interceptor / **Express `app.use`** | 미들웨어 | ALS reqId 를 프레임워크 진입 전 가장 앞단에서 세팅 |
| 응답 헤더 노출 | 안 함 / **`x-request-id` 노출** | 노출 | 검증 가능성 + Stripe/Heroku 추적 관례. 미들웨어에 `res.setHeader` 추가 |
| reqId 로그 검증 | apps/api 로그 캡처 / **응답 헤더 e2e + 기존 로거 단위** | 분리 증명 | 로그 캡처는 AppModule 로거 override 필요(복잡). e2e 헤더=실 앱 ALS 세팅 증명 + nestjs-logger 단위=child binding 증명 |
| backend-logger 의존 | 전이 의존 사용 / **직접 의존 선언** | 직접 | main.ts 가 직접 import → phantom dep 회피, knip 정합 |

### ADR 승격 가이드
- [ ] 있음
- [x] 없음 (request-id-propagation explainer 범위 내)

## 💬 사용자 협의
- **주제**: 다음 spec → 15-04. 응답 헤더 노출·검증 방식은 plan 검토 항목으로 제시 → Plan Accept 로 승인.

## 🧪 검증 결과

### 1. 단위 테스트
- `@repo/backend-logger` (12): ✅ 기존 ALS + **응답 헤더 생성/에코** 2 케이스 추가.
- `@repo/nestjs-logger`: ✅ reqId child binding 회귀(불변) — "로그에 reqId" 의 증명.

### 2. 통합 테스트 (Integration Test Required = yes)
- 로컬 Postgres(5434) 후 `pnpm --filter @apps/api test` → ✅ **102/102** (auth.e2e 42).
- "request-id" describe: 헤더 없는 요청 → `x-request-id` 새 UUID; `X-Request-Id: trace-e2e-001` → 동일 에코.

### 3. 게이트
- `pnpm turbo run lint typecheck test knip depcruise` (DATABASE_URL=로컬) → (ship gate 결과).

### 4. 수동 검증
1. `GET /auth/csrf` → 응답 `x-request-id` = UUID.
2. `X-Request-Id` 동반 → 에코.

## 🔍 발견 사항
- **로그 reqId 검증의 간접성**: 실 AppModule 의 pino 출력을 e2e 에서 캡처하려면 로거 provider override 가 필요(복잡). 응답 헤더(실 앱 ALS 세팅) + nestjs-logger 단위(child binding) 로 분리 증명하는 게 ROI 우위.
- **phantom dep**: main.ts 가 `@repo/backend-logger` 직접 import → 의존 선언 필요(전이 의존만 있으면 knip/정합 위반 소지).
- 시크릿 가드: 일부 커밋 warn 우회(기존 fixture `password:` 등 false positive).

## 🚧 이월 항목
- 분산 트레이싱(W3C traceparent) 연동 — 후속/icebox.
- 생성기 tsconfig(15-05) — phase-15 마지막 spec.

## 🔗 관련 문서 (Related)
- 관련 wiki: `docs/explainers/backend/request-id-propagation.md`, `docs/review/2026-06-01-wiring-audit.md` §D
- 관련 reference: `docs/reference/packages/backend-logger.md`

## 📅 메타
| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-01 |
| **최종 commit** | (ship 시 갱신) |
