# Walkthrough: spec-24-04

> 컨트롤러 zod 검증 3패턴을 표준 `zodPipe` 로 통일 (B2).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 수렴 대상 패턴 | parseOr400 / zodPipe / 신규 | **zodPipe** | 이미 auth/org 표준, 공유 헬퍼. parseOr400 은 zodPipe 와 동작 동일(중복) |
| mfa 검증실패 동작 | 현행 ZodError 누출 유지 / 400 통일 | **400 통일** | 검증 실패=client error. zodPipe 적용의 자연스러운 결과(개선) |
| account `body as` | 본 spec 포함 / 제외 | **제외** | zod 부재라 "통일" 아닌 신규 도입 — 별도 판단(Out of Scope) |

## 💬 사용자 협의

- **주제**: B2 를 24-03 에서 분리 → 단독 spec-24-04
  - **합의**: 분리 진행(파일 비중복, 단일 관심사).

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `turbo run lint typecheck test` (로컬 5434 DB)
- **결과**: ✅ 142/142 task. apps/api 340 tests/61 files(단위+e2e), 회귀 0.
- provider-org(6)/mfa(5)/passkey(6) 단위 테스트(24-01 안전망) 전부 PASS.

### 수동 검증
1. mfa enroll/confirm 너무 짧은 code → BadRequest(400). (이전 raw ZodError 누출 → 개선)
2. provider-org/passkey 무효 입력 → 400, 정상 입력 → 위임 동작 보존.

## 🔍 발견 사항

- `zodPipe(schema).transform(value)` 는 `parseOr400` 및 passkey try/catch 와 **완전 동일 동작**(ZodError → `BadRequestException(err.issues)`) — 치환이 순수 동작 보존.
- mfa 만 try/catch 가 없어 검증 실패가 미처리 ZodError 였음 — zodPipe 로 400 일관화(동작 개선).

## 🚧 이월 항목

- account.controller 의 `body as` 캐스트(zod 미적용) — 필요 시 후속 spec 에서 zod 도입 판단.
