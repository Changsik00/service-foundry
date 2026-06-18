# Walkthrough: spec-23-04-error-handling-convention

> phase-23 — 에러 처리 레이어링 명문화(ADR-0027) + 전역 AppError 필터로 잠재 500 버그 수정.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 전파 AppError HTTP 매핑 | 컨트롤러별 catch / 전역 필터 / 패키지가 NestJS 예외 | **전역 `AppErrorFilter`** | 183곳 반복 회피 + framework-agnostic 유지 + 단일 노출 지점 (ADR-0027) |
| oauth raw throw | 제거 / AppError 변환 | **AppError 변환** | getProvider 가 먼저 AppError(404) → dead 지만 raw Error 제거 + 일관성 + 필터 매핑 |
| 부트스트랩/invariant throw | 변환 / 유지 | **유지** | HTTP 의미 없는 fail-fast — ADR 에 예외로 명시 |
| ADR 가정(B1) 정정 | 감사대로 / 실태 반영 | **실태 반영** | apps/api AppError 0·NestJS 예외 183 → "throw→AppError" 가 아니라 "전파 AppError 매핑"이 진짜 문제 |

## 💬 사용자 협의
- 사용자 option 2(B 재설계, ADR급) 선택 → 실태조사로 "AppError 필터 부재 → 전파 시 500" 이 핵심임을 발견, ADR+전역필터로 설계. Plan Accept 승인.

## 🧪 검증 결과
- 필터 단위 테스트 2 + oauth.service 3 = 5 그린.
- `apps/api` typecheck 그린(FULL TURBO), 변경 파일 biome clean.
- oauth.service raw `throw new Error` 0 확인.
- 필터: `@Catch(AppError)` → `res.status(statusCode).json(toJSON())`. `configureApp`(SoT) 등록 → prod·e2e 동일 체인.

## 🔍 발견 사항
- **감사 B1 가정 오류 정정**: apps/api 는 이미 NestJS 예외 컨벤션을 일관 준수(183곳, AppError 0). 진짜 갭은 "도메인 패키지가 던진 AppError 가 경계 필터 부재로 일괄 500". 예: `getProvider(unknown)` → AppError(404) → (필터 전) 500.
- 전역 필터 도입으로 이 클래스의 잠재 500 이 의미상 상태코드로 교정됨(동작 변경 — 의도된 correctness).

## 🚧 이월 항목
- **B2(컨트롤러 zod 검증 3패턴 통일)** → 별도 spec (passkey/mfa 컨트롤러 안전망 선행).
- D2/D3/D4/D6 dedup, F 복잡도 → 23-05+.
- 다음: spec-23-05 (F) 또는 phase-ship 검토.
