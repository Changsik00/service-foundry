# Walkthrough: spec-14-02 — 에러 처리 규약 통일

> ADR-0020(규약) + P0(silent confirm → outcome union) + P2(plain Error → AppError). 평점 에러 A-→A 트랙.

## 📌 결정 기록
| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 규약 | 자유 / decision tree | **ADR-0020 결정 트리** | Result/union/throw-AppError/boolean 기준 명문화 |
| 범위 | P0만 / P0+P2 / 전체 | **P0+P2 (사용자)** | 위험·저비용 위반 우선, P1/P3 후속 |
| confirm | void / Result / union | **outcome union** | 관측 가능 + 컨트롤러 200 고정으로 enumeration-safe 유지 |
| plain Error | 유지 / AppError | **AppError(INTERNAL/NOT_FOUND)** | 직렬화·코드 일관. AppError ⊂ Error → 비파괴 |

### ADR 승격
- [x] **ADR-0020 error-handling-convention** (`docs/adr/0020-...`) — 본 spec 핵심 산출물.

## 🧪 검증 결과
- confirm 단위(`*.confirm.service.test.ts`): outcome 단언 11/11 ✅ (confirmed/invalid/expired/used)
- P2 4 패키지: auth-jwt 25 · auth-oauth 19 · auth-session 13 · auth-rate-limit 18 = 75 ✅ (비파괴 — AppError 도 Error 서브클래스)
- typecheck: 영향 패키지 + apps/api Done
- 통합: 본 PR `verify` CI (PG service 포함 전체) — green 확인.

## 🔍 발견 사항
- `getProvider(name)` 의 미지 provider 는 사용자 입력성(라우트 파라미터) → INTERNAL 아닌 **NOT_FOUND(404)** 가 정확. 나머지 5곳은 진짜 불변식 → INTERNAL(500).
- confirm 의 enumeration-safe 는 **서비스가 아닌 경계(컨트롤러)의 책임**임을 ADR §보안 예외로 명문화 — 서비스는 정확한 outcome, 컨트롤러가 200 일괄 매핑.

## 🚧 이월 항목
- **P1**: auth-password/mfa/oauth 의 boolean·`-1` → Result 전환.
- **P3**: NestJS ExceptionFilter 로 AppError→HTTP 자동 매핑.
- confirm outcome 의 실제 컨트롤러 로깅 배선(현재 무시) — 관측 강화 시.

## 🔗 관련
- ADR-0008(Result), ADR-0009(AppError), ADR-0020(신규)
- phase-14 성공 기준 1. 후속: P1/P3.

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 커밋 | docs(ADR) 1 + refactor 2 + ship 1 |
